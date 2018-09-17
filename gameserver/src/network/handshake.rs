use futures::{Future, Poll, Async, Sink};
use prost::Message;
use std::io;
use std::mem;

use super::connection_router::{Router, ConnectionRouter};
use super::connection_table::ConnectionData;
use super::tcp::Channel;

use protocol as proto;

use protocol::ConnectionRequest;

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




// impl<R: Router> From<()> for HandshakerState<R> {
//     fn from(_: ()) -> Self {
//         HandshakerState::Done
//     }
// }

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
        let request = try!(ConnectionRequest::decode(&frame));

        match self.router.route(&request.message) {
            Err(err) => {
                let response = connection_error(err.to_string());
                try!(self.channel.send_protobuf(response));

                let refusing = Refusing {
                    channel: self.channel
                };
                return Ok(Step::Ready(HandshakeState::Refusing(refusing)));

            }
            Ok(data) => {
                let response = connection_success();
                try!(self.channel.send_protobuf(response));
                let accepting = Accepting {
                    channel: self.channel,
                    connection_data: data,
                };
                return Ok(Step::Ready(HandshakeState::Accepting(accepting)));
            }
        };

    }
}

impl<R: Router> From<Identifying<R>> for HandshakeState<R> {
    fn from(identifying: Identifying<R>) -> Self {
        HandshakeState::Identifying(identifying)
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