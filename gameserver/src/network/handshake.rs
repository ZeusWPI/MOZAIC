use futures::{Future, Poll, Async};
use futures::sink;
use prost::Message;
use std::io;
use std::mem;

use super::connection_handler::ConnectionHandle;
use super::connection_router::{Router, ConnectionRouter};
use super::tcp::Channel;
use protocol as proto;

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


fn connection_success() -> proto::ConnectionResponse {
   proto::ConnectionResponse {
        response: Some(
            proto::connection_response::Response::Success(
                proto::ConnectionSuccess { }
            )
        )
    }
}

fn connection_error(msg: String) -> proto::ConnectionResponse {
    proto::ConnectionResponse {
        response: Some(
            proto::connection_response::Response::Error(
                proto::ConnectionError {
                    message: msg,
                }
            )
        )
    }
}

struct Waiting<R: Router> {
    channel: Channel,
    router: ConnectionRouter<R>,
}

impl<R: Router> Waiting<R> {
    fn step(mut self) -> HandshakeStep<Self, R>
    {
        let bytes = try_ready_or!(self, self.channel.poll_frame());
        let request = try!(proto::ConnectionRequest::decode(bytes));

        match self.router.route(&request.message) {
            Err(err) => {
                let response = connection_error(err.to_string());

                let refusing = Refusing {
                    send: self.channel.send_protobuf(response),
                };
                return Ok(Step::Ready(HandshakeState::Refusing(refusing)));

            }
            Ok(data) => {
                let response = connection_success();
                let accepting = Accepting {
                    send: self.channel.send_protobuf(response),
                    handle: data.handle,
                };
                return Ok(Step::Ready(HandshakeState::Accepting(accepting)));
            }
        };
    }
}

struct Accepting {
    send: sink::Send<Channel>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn step<R: Router>(mut self) -> HandshakeStep<Self, R> {
        let channel = try_ready_or!(self, self.send.poll());
        self.handle.connect(channel);
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

struct Refusing {
    send: sink::Send<Channel>,
}

impl Refusing {
    fn step<R: Router>(mut self) -> HandshakeStep<Self, R> {
        let _channel = try_ready_or!(self, self.send.poll());
        return Ok(Step::Ready(HandshakeState::Done));
    }
}

enum HandshakeState<R: Router> {
    Waiting(Waiting<R>),
    Accepting(Accepting),
    Refusing(Refusing),
    Done,
}

impl<R: Router> From<Waiting<R>> for HandshakeState<R> {
    fn from(waiting: Waiting<R>) -> Self {
        HandshakeState::Waiting(waiting)
    }
}

impl<R: Router> From<Accepting> for HandshakeState<R> {
    fn from(accepting: Accepting) -> Self {
        HandshakeState::Accepting(accepting)
    }
}

impl<R: Router> From<Refusing> for HandshakeState<R> {
    fn from(refusing: Refusing) -> Self {
        HandshakeState::Refusing(refusing)
    }
}

impl<R: Router> From<()> for HandshakeState<R> {
    fn from(_: ()) -> Self {
        HandshakeState::Done
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
            HandshakeState::Waiting(waiting) => try_step!(waiting),
            HandshakeState::Accepting(accepting) => try_step!(accepting),
            HandshakeState::Refusing(refusing) => try_step!(refusing),
            HandshakeState::Done => panic!("stepping done"),
        }
    }
}

pub struct Handshake<R: Router> {
    state: HandshakeState<R>,
}

impl<R: Router> Handshake<R> {
    pub fn new(router: ConnectionRouter<R>,
               channel: Channel) -> Self
    {
        Handshake {
            state: HandshakeState::Waiting(Waiting {
                channel,
                router,
            }),
        }
    }
}

impl<R: Router> Handshake<R> {
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

impl<R: Router> Future for Handshake<R> {
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