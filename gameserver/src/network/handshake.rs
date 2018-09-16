use futures::{Future, Poll, Async, Stream};
use futures::sink;
use prost::Message;
use std::io;
use std::mem;

use super::connection_handler::ConnectionHandle;
use super::connection_table::ConnectionData;
use super::connection_router::{Router, ConnectionRouter};
use super::tcp::Channel;
use protocol as proto;



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

enum Action {
    Accept {
        data: ConnectionData,
    },
    Refuse {
        reason: String,
    }
}

impl<R: Router> Waiting<R> {
    fn poll(&mut self) -> Poll<Action, io::Error>
    {
        let bytes = match self.channel.poll().unwrap() {
            Async::NotReady => return Ok(Async::NotReady),
            Async::Ready(None) => bail!(io::ErrorKind::ConnectionAborted),
            Async::Ready(Some(bytes)) => bytes,
        };

        let request = try!(proto::ConnectionRequest::decode(bytes));

        let action = match self.router.route(&request.message) {
            Err(err) => Action::Refuse { reason: err.to_string() },
            Ok(data) => Action::Accept { data },
        };
        return Ok(Async::Ready(action));
    }

    fn step(self, action: Action) -> HandlerState<R> {
        match action {
            Action::Accept { data } => {
                let response = connection_success();
                let accepting = Accepting {
                    send: self.channel.send_protobuf(response),
                    handle: data.handle,
                };
                return HandlerState::Accepting(accepting);
            },
            Action::Refuse { reason } => {
                let response = connection_error(reason);

                let refusing = Refusing {
                    send: self.channel.send_protobuf(response),
                };
                return HandlerState::Refusing(refusing);
            }
        }
    }
}


struct Accepting {
    send: sink::Send<Channel>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn poll(&mut self) -> Poll<Channel, io::Error> {
        self.send.poll()
    }

    fn step<R: Router>(mut self, channel: Channel)
        -> HandlerState<R>
    {
        // TODO
        self.handle.connect(channel);
        return HandlerState::Done;
    }
}

struct Refusing {
    send: sink::Send<Channel>,
}

impl Refusing {
    fn poll(&mut self) -> Poll<(), io::Error> {
        try_ready!(self.send.poll());
        return Ok(Async::Ready(()));
    }

    fn step<R: Router>(self) -> HandlerState<R> {
        return HandlerState::Done;
    }
}

enum HandlerState<R: Router> {
    Waiting(Waiting<R>),
    Accepting(Accepting),
    Refusing(Refusing),
    Done,
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
        loop {
            let state = mem::replace(&mut self.state, HandlerState::Done);
            match state {
                HandlerState::Waiting(mut waiting) => {
                    match try!(waiting.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Waiting(waiting);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(action) => {
                            self.state = waiting.step(action);
                        }
                    }
                }
                HandlerState::Accepting(mut accepting) => {
                    match try!(accepting.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Accepting(accepting);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(transport) => {
                            self.state = accepting.step(transport);
                        }
                    }
                }
                HandlerState::Refusing(mut refusing) => {
                    match try!(refusing.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Refusing(refusing);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(()) => {
                            self.state = refusing.step();
                        }
                    }
                }
                HandlerState::Done => {
                    return Ok(Async::Ready(()));
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