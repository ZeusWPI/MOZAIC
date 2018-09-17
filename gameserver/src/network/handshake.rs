use futures::{Future, Poll, Async, Sink};
use prost::Message;
use std::io;
use std::mem;

use super::connection_router::{Router, ConnectionRouter};
use super::connection_table::ConnectionData;
use super::tcp::Channel;

use protocol as proto;

use protocol::{
    HandshakeServerMessage,
    SignedMessage,
    ConnectionRequest,
    ChallengeResponse
};
use protocol::handshake_server_message::Payload as HandshakeServerPayload;
use sodiumoxide::crypto::sign;
use sodiumoxide::crypto::sign::{PublicKey, Signature};
use sodiumoxide::randombytes::randombytes;
use sodiumoxide::utils::memcmp;

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

macro_rules! try_ready_or {
    ($default:expr, $e:expr) => (
        match $e {
            Err(err) => return Err(err),
            Ok(Async::NotReady) => return Ok(Step::NotReady($default)),
            Ok(Async::Ready(item)) => item,
        }
    );
}

type HandshakeStep<S, R> = Result<Step<S, HandshakeState<R>>, io::Error>;

fn verify_message(message: &SignedMessage, key: &PublicKey) -> bool {
    let signature = Signature::from_slice(&message.signature).unwrap();
    return sign::verify_detached(&signature, &message.data, key);
}

fn connection_accepted() -> HandshakeServerMessage {
   HandshakeServerMessage {
        payload: Some(
            HandshakeServerPayload::ConnectionAccepted(
                proto::ConnectionAccepted { }
            )
        )
    }
}

fn connection_refused(msg: String) -> HandshakeServerMessage {
    HandshakeServerMessage {
        payload: Some(
            HandshakeServerPayload::ConnectionRefused(
                proto::ConnectionRefused {
                    message: msg,
                }
            )
        )
    }
}

fn challenge_msg(nonce: Vec<u8>) -> HandshakeServerMessage {
    HandshakeServerMessage {
        payload: Some(
            HandshakeServerPayload::Challenge(
                proto::ServerChallenge {
                    nonce,
                }
            )
        )
    }
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

impl<R: Router> HandshakeState<R> {
    fn step(self) -> Result<Step<Self, Self>, io::Error> {
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

impl<R: Router> Handshaker<R> {
    // TODO: can we get rid of this boilerplate?
    fn step(&mut self) -> Poll<(), io::Error> {
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

impl<R: Router> Future for Handshaker<R> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.step() {
            // TODO: handle this case gracefully
            Err(err) => panic!("error: {}", err),
            Ok(poll) => Ok(poll),
        }
    }
}

enum HandshakeState<R: Router> {
    Identifying(Identifying<R>),
    Challenging(Challenging),
    Refusing(Refusing),
    Accepting(Accepting),
    Done,
}

struct Identifying<R: Router> {
    router: ConnectionRouter<R>,
    channel: Channel,
}

impl<R: Router> Identifying<R> {
    fn step(mut self) -> io::Result<Step<Self, HandshakeState<R>>> {
        // make sure channel is ready for writing a response
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let frame = try_ready_or!(self, self.channel.poll_frame());

        match self.handle_request(frame) {
            Err(err) => {
                let response = connection_refused(err.to_string());
                try!(self.channel.send_protobuf(response));

                let refusing = Refusing {
                    channel: self.channel
                };
                return Ok(Step::Ready(HandshakeState::Refusing(refusing)));

            }
            Ok(data) => {
                let nonce = randombytes(NONCE_NUM_BYTES);
                let msg = challenge_msg(nonce.clone());
                try!(self.channel.send_protobuf(msg));
                let challenging = Challenging {
                    server_nonce: nonce,
                    channel: self.channel,
                    connection_data: data,
                };
                return Ok(Step::Ready(challenging.into()));            }
        };
    }

    fn handle_request(&mut self, frame: Vec<u8>)
        -> io::Result<ConnectionData>
    {
        let signed_msg = try!(SignedMessage::decode(&frame));
        let request = try!(ConnectionRequest::decode(&signed_msg.data));

        let conn_data = try!(self.router.route(&request.message));

        // TODO: properly handle this
        if !verify_message(&signed_msg, &conn_data.public_key) {
            return Err(io::Error::new(
                io::ErrorKind::Other,
                "invalid signature"
            ));
        }

        return Ok(conn_data);
    }
}

impl<R: Router> From<Identifying<R>> for HandshakeState<R> {
    fn from(identifying: Identifying<R>) -> Self {
        HandshakeState::Identifying(identifying)
    }
}

struct Challenging {
    channel: Channel,
    connection_data: ConnectionData,
    server_nonce: Vec<u8>,
}

impl Challenging {
    fn step<R>(mut self) -> io::Result<Step<Self, HandshakeState<R>>>
        where R: Router
    {
        // make sure channel is ready for writing a response
        if self.channel.poll_ready().unwrap().is_not_ready() {
            return Ok(Step::NotReady(self));
        }

        let frame = try_ready_or!(self, self.channel.poll_frame());
        let signed_msg = try!(SignedMessage::decode(&frame));
        if !verify_message(&signed_msg, &self.connection_data.public_key) {
            return Err(io::Error::new(
                io::ErrorKind::Other,
                "invalid signature"
            ));
        }

        let response = try!(ChallengeResponse::decode(&signed_msg.data));

        if !memcmp(&self.server_nonce, &response.nonce) {
            return Err(io::Error::new(
                io::ErrorKind::Other,
                "invalid nonce"
            ));
        }

        // succesfully completed challenge, accept connection.
        let response = connection_accepted();
        try!(self.channel.send_protobuf(response));
        let accepting = Accepting {
            channel: self.channel,
            connection_data: self.connection_data,
        };
        return Ok(Step::Ready(HandshakeState::Accepting(accepting)));
    }
}

impl<R: Router> From<Challenging> for HandshakeState<R> {
    fn from(challenging: Challenging) -> Self {
        HandshakeState::Challenging(challenging)
    }
}

// TODO: is this step required?
struct Accepting {
    channel: Channel,
    connection_data: ConnectionData,
}

impl Accepting {
    fn step<R: Router>(mut self) -> HandshakeStep<Self, R> {
        try_ready_or!(self, self.channel.poll_complete());
        self.connection_data.handle.connect(self.channel);
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

impl<R: Router> From<Accepting> for HandshakeState<R> {
    fn from(accepting: Accepting) -> Self {
        HandshakeState::Accepting(accepting)
    }
}

struct Refusing {
    channel: Channel,
}

impl Refusing {
    fn step<R: Router>(mut self) -> HandshakeStep<Self, R> {
        try_ready_or!(self, self.channel.poll_complete());
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

impl<R: Router> From<Refusing> for HandshakeState<R> {
    fn from(refusing: Refusing) -> Self {
        HandshakeState::Refusing(refusing)
    }
}