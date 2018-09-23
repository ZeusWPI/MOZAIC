use futures::{Future, Poll, Async, Sink};
use prost::Message;
use std::io;
use std::mem;

use super::connection_router::{Router, ConnectionRouter, ConnectionRouting};
use super::channel::Channel;
use super::crypto::{KxKeypair, SessionKeys};

use protocol::{
    HandshakeServerMessage,
    SignedMessage,
    ConnectionRequest,
    ChallengeResponse
};
use protocol::handshake_server_message::Payload as ServerMessage;
use protocol::{ServerChallenge, ConnectionAccepted};
use sodiumoxide::crypto::sign;
use sodiumoxide::crypto::sign::{PublicKey, SecretKey, Signature};
use sodiumoxide::randombytes::randombytes;
use sodiumoxide::utils::memcmp;

use sodiumoxide::crypto::kx;

pub mod errors {
    error_chain! { }
}

use self::errors::*;


const NONCE_NUM_BYTES: usize = 32;

enum Step<State, Next> {
    NotReady(State),
    Ready(Next),
}

impl<State, Next> Step<State, Next> {
    fn map_not_ready<F, R>(self, fun: F) -> Step<R, Next>
        where F: FnOnce(State) -> R
    {
        match self {
            Step::Ready(next) => Step::Ready(next),
            Step::NotReady(state) => Step::NotReady(fun(state)),
        }
    }
}

type HandshakeStep<S, R> = io::Result<Step<S, HandshakeState<R>>>;

macro_rules! try_ready_or {
    ($default:expr, $e:expr) => (
        match $e {
            Err(err) => return Err(err),
            Ok(Async::NotReady) => return Ok(Step::NotReady($default)),
            Ok(Async::Ready(item)) => item,
        }
    );
}

fn verify_signature(message: &SignedMessage, key: &PublicKey) -> bool {
    if let Some(signature) = Signature::from_slice(&message.signature) {
        if sign::verify_detached(&signature, &message.data, key) {
            return true;
        }
    }
    return false;
}

fn encode_server_message(message: ServerMessage,
                         client_nonce: &[u8],
                         key: &SecretKey)
                         -> SignedMessage
{
    let server_message = HandshakeServerMessage {
        client_nonce: client_nonce.to_vec(),
        payload: Some(message),
    };

    let mut buffer = Vec::with_capacity(server_message.encoded_len());
    server_message.encode(&mut buffer).unwrap();

    let signature = sign::sign_detached(&buffer, key);

    return SignedMessage {
        data: buffer,
        signature: signature.as_ref().to_vec(),
    };
}

macro_rules! try_step {
    ($e:expr) => (
        match $e.step() {
            Err(err) => Err(err),
            Ok(Step::Ready(state)) => Ok(Step::Ready(state.into())),
            Ok(Step::NotReady(state)) => Ok(Step::NotReady(state.into())),
        }
    )
}

impl<R> HandshakeState<R>
    where R: Router + Send + 'static
{
    fn step(self) -> Result<Step<Self, Self>> {
        match self {
            HandshakeState::Identifying(identifying) => try_step!(identifying),
            HandshakeState::Challenging(challenging) => try_step!(challenging),
            HandshakeState::Accepting(accepting) => try_step!(accepting),
            HandshakeState::Refusing(refusing) => try_step!(refusing),
            HandshakeState::Done => panic!("stepping done"),
        }
    }
}

pub struct Handshaker<R: Router> {
    state: HandshakeState<R>,
}

impl<R: Router> Handshaker<R> {
    pub fn new(router: ConnectionRouter<R>,
               channel: Channel) -> Self
    {
        Handshaker {
            state: HandshakeState::Identifying(Identifying {
                channel,
                router,
            }),
        }
    }
}

impl<R> Handshaker<R>
    where R: Router + Send + 'static
{
    fn step(&mut self) -> Poll<(), Error> {
        let mut state = mem::replace(&mut self.state, HandshakeState::Done);
        loop {
            if let HandshakeState::Done = state {
                return Ok(Async::Ready(()));
            };

            match try!(state.step()) {
                Step::NotReady(state) => {
                    self.state = state;
                    return Ok(Async::NotReady);
                }
                Step::Ready(next_state) => {
                    state = next_state;
                }
            }
        }
    }
}

impl<R> Future for Handshaker<R>
    where R: Router + Send + 'static
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.step() {
            Ok(poll) => Ok(poll),
            Err(ref err) => {
                eprintln!("handshake failed: {}", err);

                for e in err.iter().skip(1) {
                    eprintln!("    caused by: {}", e);
                }

                return Err(());
            },
        }
    }
}

enum HandshakeState<R: Router> {
    Identifying(Identifying<R>),
    Challenging(Challenging<R>),
    Refusing(Refusing),
    Accepting(Accepting<R>),
    Done,
}

struct Identifying<R: Router> {
    router: ConnectionRouter<R>,
    channel: Channel,
}

impl<R: Router> Identifying<R> {
    fn step(mut self) -> Result<Step<Self, HandshakeState<R>>> {
        // make sure channel is ready for writing a response
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let frame = try_ready_or!(
            self,
            self.channel
                .poll_frame()
                .chain_err(|| "failed to receive frame")
        );

        let signed_msg = SignedMessage::decode(&frame)
            .chain_err(|| "failed to decode SignedMessage")?;
        let request = ConnectionRequest::decode(&signed_msg.data)
            .chain_err(|| "failed to decode ConnectionRequest")?;

        let routing = self.router.route(&request.message)
            .chain_err(|| "routing failed")?;

        if !verify_signature(&signed_msg, routing.public_key()) {
            bail!("invalid signature");
        }

        let server_nonce = randombytes(NONCE_NUM_BYTES);
        let kx_keypair = KxKeypair::gen();

        let challenge = ServerMessage::Challenge(
            ServerChallenge {
                server_nonce: server_nonce.clone(),
                kx_server_pk: kx_keypair.public_key.as_ref().to_vec(),
            }
        );

        let secret_key = self.router.secret_key.clone();

        let challenge_msg = encode_server_message(
            challenge,
            &request.client_nonce,
            &secret_key
        );

        self.channel.send_protobuf(challenge_msg)
            .chain_err(|| "send failed")?;

        let challenging = Challenging {
            channel: self.channel,
            routing,
            client_nonce: request.client_nonce,
            server_nonce,
            secret_key,
            kx_keypair,
        };
        return Ok(Step::Ready(challenging.into()));
    }
}

impl<R: Router> From<Identifying<R>> for HandshakeState<R> {
    fn from(identifying: Identifying<R>) -> Self {
        HandshakeState::Identifying(identifying)
    }
}

struct Challenging<R>
    where R: Router
{
    channel: Channel,
    routing: ConnectionRouting<R>,
    secret_key: SecretKey,
    client_nonce: Vec<u8>,
    server_nonce: Vec<u8>,

    kx_keypair: KxKeypair,
}

impl<R> Challenging<R>
    where R: Router
{
    fn step(mut self) -> Result<Step<Self, HandshakeState<R>>>
    {
        // make sure channel is ready for writing a response
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let frame = try_ready_or!(
            self,
            self.channel
                .poll_frame()
                .chain_err(|| "failed to receive frame")
        );

        let signed_msg = SignedMessage::decode(&frame)
            .chain_err(|| "failed to decode SignedMessage")?;

        if !verify_signature(&signed_msg, &self.routing.public_key()) {
            bail!("invalid signature");
        }

        let response = ChallengeResponse::decode(&signed_msg.data)
            .chain_err(|| "failed to decode ChallengeResponse")?;

        if !memcmp(&self.server_nonce, &response.server_nonce) {
            bail!("invalid nonce");
        }

        let session_keys = self.session_keys(&response.kx_client_pk)?;

        // succesfully completed challenge, accept connection.
        let accepted = ServerMessage::ConnectionAccepted(
            ConnectionAccepted { }
        );

        let message = encode_server_message(
            accepted,
            &self.client_nonce,
            &self.secret_key
        );

        self.channel.send_protobuf(message)
            .chain_err(|| "failed to send ConnectionAccepted")?;

        let accepting = Accepting {
            channel: self.channel,
            routing: self.routing,
            session_keys,
        };
        return Ok(Step::Ready(accepting.into()));
    }

    fn session_keys(&self, kx_client_pk: &[u8]) -> Result<SessionKeys> {
        match kx::PublicKey::from_slice(kx_client_pk) {
            Some(key) => self.kx_keypair.server_session_keys(&key),
            None => bail!("invalid kx public key received")
        }
    }
}

impl<R: Router> From<Challenging<R>> for HandshakeState<R> {
    fn from(challenging: Challenging<R>) -> Self {
        HandshakeState::Challenging(challenging)
    }
}

// TODO: is this step required?
struct Accepting<R>
    where R: Router
{
    channel: Channel,
    routing: ConnectionRouting<R>,
    session_keys: SessionKeys,
}

impl<R> Accepting<R>
    where R: Router + Send + 'static
{
    fn step(mut self) -> Result<Step<Self, HandshakeState<R>>> {
        try_ready_or!(
            self,
            self.channel
                .poll_complete()
                .chain_err(|| "failed to send ConnectionAccepted")
        );
        self.routing.connect(self.channel, self.session_keys);
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

impl<R: Router> From<Accepting<R>> for HandshakeState<R> {
    fn from(accepting: Accepting<R>) -> Self {
        HandshakeState::Accepting(accepting)
    }
}

struct Refusing {
    channel: Channel,
}

impl Refusing {
    fn step<R: Router>(mut self) -> Result<Step<Self, HandshakeState<R>>> {
        try_ready_or!(
            self,
            self.channel
                .poll_complete()
                .chain_err(|| "failed to send ConnectionRefused")
        );
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

impl<R: Router> From<Refusing> for HandshakeState<R> {
    fn from(refusing: Refusing) -> Self {
        HandshakeState::Refusing(refusing)
    }
}