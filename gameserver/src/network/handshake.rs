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

type HandlerStep<S, R> = Result<Step<S, HandlerState<R>>, io::Error>;


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
    fn step(mut self) -> HandlerStep<Self, R>
    {
        let bytes = try_ready_or!(self, self.channel.poll_frame());
        let request = try!(proto::ConnectionRequest::decode(bytes));

        match self.router.route(&request.message) {
            Err(err) => {
                let response = connection_error(err.to_string());

                let refusing = Refusing {
                    send: self.channel.send_protobuf(response),
                };
                return Ok(Step::Ready(HandlerState::Refusing(refusing)));

            }
            Ok(data) => {
                let response = connection_success();
                let accepting = Accepting {
                    send: self.channel.send_protobuf(response),
                    handle: data.handle,
                };
                return Ok(Step::Ready(HandlerState::Accepting(accepting)));
            }
        };
    }
}

struct Accepting {
    send: sink::Send<Channel>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn step<R: Router>(mut self) -> HandlerStep<Self, R> {
        let channel = try_ready_or!(self, self.send.poll());
        self.handle.connect(channel);
        return Ok(Step::Ready(HandlerState::Done));
    }
}

struct Refusing {
    send: sink::Send<Channel>,
}

impl Refusing {
    fn step<R: Router>(mut self) -> HandlerStep<Self, R> {
        let _channel = try_ready_or!(self, self.send.poll());
        return Ok(Step::Ready(HandlerState::Done));
    }
}

enum HandlerState<R: Router> {
    Waiting(Waiting<R>),
    Accepting(Accepting),
    Refusing(Refusing),
    Done,
}

impl<R: Router> From<Waiting<R>> for HandlerState<R> {
    fn from(waiting: Waiting<R>) -> Self {
        HandlerState::Waiting(waiting)
    }
}

impl<R: Router> From<Accepting> for HandlerState<R> {
    fn from(accepting: Accepting) -> Self {
        HandlerState::Accepting(accepting)
    }
}

impl<R: Router> From<Refusing> for HandlerState<R> {
    fn from(refusing: Refusing) -> Self {
        HandlerState::Refusing(refusing)
    }
}

impl<R: Router> From<()> for HandlerState<R> {
    fn from(_: ()) -> Self {
        HandlerState::Done
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

impl<R: Router> HandlerState<R> {
    fn step(self) -> Result<Step<Self, Self>, io::Error> {
        match self {
            HandlerState::Waiting(waiting) => try_step!(waiting),
            HandlerState::Accepting(accepting) => try_step!(accepting),
            HandlerState::Refusing(refusing) => try_step!(refusing),
            HandlerState::Done => panic!("stepping done"),
        }
    }
}

pub struct Handshake<R: Router> {
    state: HandlerState<R>,
}

impl<R: Router> Handshake<R> {
    pub fn new(router: ConnectionRouter<R>,
               channel: Channel) -> Self
    {
        Handshake {
            state: HandlerState::Waiting(Waiting {
                channel,
                router,
            }),
        }
    }
}

impl<R: Router> Handshake<R> {
    // TODO: can we get rid of this boilerplate?
    fn step(&mut self) -> Poll<(), io::Error> {
        let mut state = mem::replace(&mut self.state, HandlerState::Done);
        loop {
            if let HandlerState::Done = state {
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