use prost::Message;
use sodiumoxide::crypto::sign::SecretKey;
use sodiumoxide::crypto::kx;
use futures::{Future, Poll, Async, Sink, AsyncSink};
use std::io;

use network::lib::ConnectionHandle;
use protocol::{
    HandshakeServerMessage,
    SignedMessage,
    ConnectionRequest,
    ChallengeResponse,
};
use protocol::handshake_server_message::Payload as ServerMessage;


use network::lib::errors::*;
use network::lib::channel::Channel;
use network::lib::crypto;
use network::utils::encode_protobuf;

// TODO: actually check server credentials

// TODO: distinguish between fatal and non-fatal errors
// (maybe a rogue message should be ignored rather than cause a failure)

struct HandshakeData {
    secret_key: SecretKey,
    client_nonce: Vec<u8>,
    kx_keypair: crypto::KxKeypair,
    message: Vec<u8>,
}

struct ServerData {
    server_nonce: Vec<u8>,
    kx_server_pk: kx::PublicKey,
}

struct Handshake {
    channel: Option<Channel>,
    send_buf: Option<Vec<u8>>,
    data: HandshakeData,
    state: HandshakeState,
}

enum HandshakeState {
    Connecting,
    Authenticating(ServerData),
}

impl Handshake {
    pub fn new(
        channel: Channel,
        secret_key: SecretKey,
        message: Vec<u8>,
    ) -> Self
    {
        let client_nonce = crypto::handshake_nonce();
        let kx_keypair = crypto::KxKeypair::gen();

        let data = HandshakeData {
            secret_key,
            client_nonce,
            kx_keypair,
            message,
        };

        let mut h = Handshake {
            channel: Some(channel),
            send_buf: None,
            data,
            state: HandshakeState::Connecting,
        };
        // queue initial connect message
        h.send_handshake_message();
        return h;
    }

    fn encode_connection_request(&self) -> Vec<u8> {
        let conn_request = ConnectionRequest {
            client_nonce: self.data.client_nonce.clone(),
            message: self.data.message.clone(),
        };

        return encode_protobuf(&conn_request);
    }

    fn encode_challenge_response(&self, server_data: &ServerData) -> Vec<u8> {
        let challenge_response = ChallengeResponse {
            server_nonce: server_data.server_nonce.clone(),
            kx_client_pk: self.data.kx_keypair.public_key[..].to_vec(),
        };

        return encode_protobuf(&challenge_response);
    }

    fn handle_message(&mut self, message: ServerMessage)
        -> Poll<crypto::SessionKeys, Error>
    {
        match message {
            ServerMessage::Challenge(challenge) => {
                let kx_server_pk = kx::PublicKey::from_slice(&challenge.kx_server_pk)
                    .chain_err(|| "invalid public key")?;
                let server_data = ServerData {
                    server_nonce: challenge.server_nonce,
                    kx_server_pk,
                };
                self.state = HandshakeState::Authenticating(server_data);
                // TODO: make sure response is sent
                return Ok(Async::NotReady);
            }
            ServerMessage::ConnectionAccepted(_accepted) => {
                // TODO: maybe un-nest this
                match self.state {
                    HandshakeState::Connecting => {
                        bail!("server accepted before handshake was completed");
                    }
                    HandshakeState::Authenticating(ref data) => {
                        let session_keys = self.data.kx_keypair
                            .client_session_keys(&data.kx_server_pk)?;
                        return Ok(Async::Ready(session_keys));
                    }
                }                
            }
            ServerMessage::ConnectionRefused(refused) => {
                // TODO: produce nicer error or something
                bail!(refused.message);
            }
        }
    }

    fn poll_message(&mut self) -> Poll<ServerMessage, io::Error> {
        let channel = match self.channel {
            None => panic!("[poll_message] channel moved"),
            Some(ref mut channel) => channel,
        };

        loop {
            let frame = try_ready!(channel.poll_frame());
            let signed_msg = try!(SignedMessage::decode(&frame));
            let server_msg = try!(HandshakeServerMessage::decode(&signed_msg.data));
            if let Some(payload) =  server_msg.payload {
                return Ok(Async::Ready(payload));
            }
        }
    }

    fn poll_send(&mut self) -> Poll<(), io::Error> {
        let channel = match self.channel {
            None => panic!("[poll_send] channel moved"),
            Some(ref mut channel) => channel,
        };

        if let Some(buf) = self.send_buf.take() {
            match try!(channel.start_send(buf)) {
                AsyncSink::Ready => {}
                AsyncSink::NotReady(buf) => {
                    self.send_buf = Some(buf);
                    return Ok(Async::NotReady);
                }
            }
        }
        return channel.poll_complete();
    }

    fn send_handshake_message(&mut self) {
        let message = match self.state {
            HandshakeState::Connecting => {
                self.encode_connection_request()
            }
            HandshakeState::Authenticating(ref data) => {
                self.encode_challenge_response(data)
            }
        };
        self.queue_send(message);
    }

    fn queue_send(&mut self, data: Vec<u8>) {
        let signed_message = crypto::sign_message(data, &self.data.secret_key);
        self.send_buf = Some(encode_protobuf(&signed_message));
    }
}

impl Future for Handshake {
    // TODO: make this into a proper datatype
    type Item = (Channel, crypto::SessionKeys);
    type Error = Error;

    fn poll(&mut self) -> Poll<Self::Item, Error> {
        loop {
            // flush send buffer
            try_ready!(self.poll_send());

            let message = try_ready!(self.poll_message());

            match self.handle_message(message) {
                Err(err) => bail!(err),
                Ok(Async::Ready(session_keys)) => {
                    let channel = self.channel.take().unwrap();
                    return Ok(Async::Ready((channel, session_keys)));
                }
                Ok(Async::NotReady) => {
                    self.send_handshake_message();
                }
            }
        }
    }
}

pub struct Handshaker {
    handshake: Handshake,
    conn_handle: ConnectionHandle,
}

impl Handshaker {
    pub fn new(
        channel: Channel,
        secret_key: SecretKey,
        message: Vec<u8>,
        conn_handle: ConnectionHandle,
    ) -> Self
    {
        Handshaker {
            conn_handle,
            handshake: Handshake::new(channel, secret_key, message),
        }
    }
}

impl Future for Handshaker {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.handshake.poll() {
            Ok(Async::Ready((chan, keys))) => {
                self.conn_handle.connect(chan, keys);
                return Ok(Async::Ready(()));
            }
            Ok(Async::NotReady) => {
                return Ok(Async::NotReady);
            }
            Err(err) => {
                eprintln!("handshake errored: {}", err);
                return Ok(Async::Ready(()));
            }
        }
    }
}