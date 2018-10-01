use prost::Message;
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};
use sodiumoxide::crypto::kx;
use futures::{Future, Poll, Async, Sink, AsyncSink};
use std::io;

use protocol::{
    HandshakeServerMessage,
    SignedMessage,
    ConnectionRequest,
    ChallengeResponse
};
use protocol::handshake_server_message::Payload as ServerMessage;


use network::lib::errors::*;
use network::lib::channel::Channel;
use network::lib::crypto;
use network::utils::encode_protobuf;

fn decode_server_message(bytes: &[u8]) -> Result<ServerMessage> {
    let signed_msg = SignedMessage::decode(bytes)
        .chain_err(|| "failed to decode SignedMessage")?;

    let msg = HandshakeServerMessage::decode(&signed_msg.data)
        .chain_err(|| "failed to decode ServerMessage")?;
    
    match msg.payload {
        Some(server_message) => Ok(server_message),
        None => bail!("empty server message"),
    }
}

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
    channel: Channel,
    send_buf: Option<Vec<u8>>,
    data: HandshakeData,
    state: HandshakeState,
}

enum HandshakeState {
    Connecting,
    Authenticating(ServerData),
}

impl Handshake {
    pub fn new(channel: Channel, secret_key: SecretKey, message: Vec<u8>)
        -> Self
    {
        let client_nonce = crypto::handshake_nonce();
        let kx_keypair = crypto::KxKeypair::gen();

        let data = HandshakeData {
            secret_key,
            client_nonce,
            kx_keypair,
            message,
        };

        return Handshake {
            channel,
            send_buf: None,
            data,
            state: HandshakeState::Connecting,
        };
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

    fn handle_message(&mut self, message: ServerMessage) -> Poll<(), ()> {
        match message {
            ServerMessage::Challenge(challenge) => {
                return Ok(Async::NotReady);
            }
            _ => unimplemented!()
        }
    }

    fn poll_message(&mut self) -> Poll<Vec<u8>, io::Error> {
        let frame = try!(self.channel.poll_frame());
        unimplemented!()
    }

    fn poll_send(&mut self) -> Poll<(), io::Error> {
        if let Some(buf) = self.send_buf.take() {
            match try!(self.channel.start_send(buf)) {
                AsyncSink::Ready => {}
                AsyncSink::NotReady(buf) => {
                    self.send_buf = Some(buf);
                    return Ok(Async::NotReady);
                }
            }
        }
        return self.channel.poll_complete();
    }
}

impl Future for Handshake {
    type Item = ();
    type Error = io::Error;

    fn poll(&mut self) -> Poll<(), io::Error> {
        // make sure the send buffer is empty
        try_ready!(self.poll_send());
        // TODO: receive a message
        unimplemented!()
    }
}
