use prost::Message;
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

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
use network::utils::Step;

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

struct Handshake {
    channel: Channel,
    state: HandshakeState,
}

impl Handshake {
    pub fn new(channel: Channel, secret_key: SecretKey, message: Vec<u8>)
        -> Self
    {
        let client_nonce = crypto::handshake_nonce();
        let connecting = Connecting {
            secret_key,
            client_nonce,
            message,
        };

        return Handshake {
            channel,
            state: connecting.into()
        };
    }
}

enum HandshakeState {
    Starting(Starting),
    Connecting(Connecting),
    Authenticating(Authenticating),
    Done,
}

impl HandshakeState {
    fn receive_message(mut self, msg: ServerMessage)
        -> Result<HandshakeState>
    {
        match self {
            HandshakeState::Connecting(connecting) => {
                connecting.receive_message(msg)
            }
            _ => unimplemented!()
        }
    }

    fn encode_message(&self) -> Vec<u8> {
        match self {
            HandshakeState::Connecting(connecting) => {
                connecting.encode_message()
            }
            _ => unimplemented!()
        }
    }
}

// TODO: get rid of this
struct Starting {
    channel: Channel,
    secret_key: SecretKey,
    message: Vec<u8>,
}

impl Starting {
    fn step(mut self) -> Result<Step<Self, HandshakeState>> {
        // make sure channel is ready for writing
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let client_nonce = crypto::handshake_nonce();

        let conn_request = ConnectionRequest {
            client_nonce: client_nonce.clone(),
            message: self.message,
        };

        let mut buffer = Vec::with_capacity(conn_request.encoded_len());
        conn_request.encode(&mut buffer).unwrap();

        let message = crypto::sign_message(buffer, &self.secret_key);

        self.channel.send_protobuf(message)
            .chain_err(|| "send failed")?;

        let connecting = Connecting {
            channel: self.channel,
            secret_key: self.secret_key,
            client_nonce,
        };
        return Ok(Step::Ready(connecting.into()));
    }
}

impl From<Starting> for HandshakeState {
    fn from(starting: Starting) -> Self {
        HandshakeState::Starting(starting)
    }
}

struct Connecting {
    message: Vec<u8>,
    client_nonce: Vec<u8>,
    secret_key: SecretKey,
}

struct Authenticating {
    client_nonce: Vec<u8>,
    server_nonce: Vec<u8>,
}

impl From<Authenticating> for HandshakeState {
    fn from(authenticating: Authenticating) -> Self {
        HandshakeState::Authenticating(authenticating)
    }
}

impl Connecting {
    fn receive_message(mut self, msg: ServerMessage)
        -> Result<HandshakeState>
    {
        match msg {
            ServerMessage::Challenge(challenge) => {
                let auth = Authenticating {
                    client_nonce: self.client_nonce,
                    server_nonce: challenge.server_nonce,
                };
                return Ok(auth.into())
            }
            _ => unimplemented!()
        }
        unimplemented!()
    }

    fn encode_message(&self) -> Vec<u8> {
        let conn_request = ConnectionRequest {
            client_nonce: self.client_nonce.clone(),
            message: self.message.clone(),
        };

        let mut buffer = Vec::with_capacity(conn_request.encoded_len());
        conn_request.encode(&mut buffer).unwrap();

        return buffer;
    }

    fn step(mut self) -> Result<Step<Self, HandshakeState>> {
        // make sure channel is ready for writing
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let frame = try_ready_or!(
            self,
            self.channel
                .poll_frame()
                .chain_err(|| "failed to receive frame")
        );


        let challenge = match try!(decode_server_message(frame)) {
            ServerMessage::Challenge(challenge) => challenge,
            ServerMessage::ConnectionAccepted(accepted) => {
                bail!("got unexpected connection accepted")
            }
            ServerMessage::ConnectionRefused(refused) => {
                bail!("connection refused")
            }
        };

        let keypair = crypto::KxKeypair::gen();

        let response = ChallengeResponse {
            server_nonce: challenge.server_nonce.clone(),
            kx_client_pk: keypair.public_key[..].to_vec(),
        };

        let mut buffer = Vec::with_capacity(response.encoded_len());
        response.encode(&mut buffer).unwrap();

        let signed_message = crypto::sign_message(buffer, &self.secret_key);

        self.channel.send_protobuf(signed_message)
            .chain_err(|| "send failed")?;

        unimplemented!()
    }
}

impl From<Connecting> for HandshakeState {
    fn from(connecting: Connecting) -> Self {
        HandshakeState::Connecting(connecting)
    }
}



struct AwaitingConfirm {
    channel: Channel,
    secret_key: SecretKey,
    client_nonce: Vec<u8>,
    server_nonce: Vec<u8>,
}