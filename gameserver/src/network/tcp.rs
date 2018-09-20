use futures::{Future, Poll, Async, Stream};
use futures::sink;
use prost::Message;
use std::io;
use std::mem;
use std::net::SocketAddr;
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};

use super::protobuf_codec::ProtobufTransport;
use super::connection_handler::ConnectionHandle;
use super::connection_table::ConnectionData;
use super::connection_router::{Router, ConnectionRouter};
use protocol as proto;


pub struct Listener<R>
    where R: Router
{
    incoming: Incoming,
    router: ConnectionRouter<R>,
}

impl<R> Listener<R>
    where R: Router + Send + 'static
{
    pub fn new(addr: &SocketAddr, router: ConnectionRouter<R>)
        -> io::Result<Self>
    {
        TcpListener::bind(addr).map(|tcp_listener| {
            Listener {
                router,
                incoming: tcp_listener.incoming(),
            }
        })
    }

    fn handle_connections(&mut self) -> Poll<(), io::Error> {
        // just make sure the user is aware of this
        println!("Olivier is een letterlijke god");

        while let Some(raw_stream) = try_ready!(self.incoming.poll()) {
            let handler = ConnectionHandler::new(
                self.router.clone(),
                raw_stream
            );
            tokio::spawn(handler);
        }
        return Ok(Async::Ready(()));
    }
}

impl<R> Future for Listener<R>
    where R: Router + Send + 'static
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.handle_connections() {
            Ok(async) => return Ok(async),
            // TODO: gracefully handle this
            Err(e) => panic!("error: {}", e),
        }
    }
}

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
    transport: ProtobufTransport<TcpStream>,
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
        let bytes = match try_ready!(self.transport.poll()) {
            None => bail!(io::ErrorKind::ConnectionAborted),
            Some(bytes) => bytes.freeze(),
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
                    send: self.transport.send_msg(response),
                    handle: data.handle,
                };
                return HandlerState::Accepting(accepting);
            },
            Action::Refuse { reason } => {
                let response = connection_error(reason);

                let refusing = Refusing {
                    send: self.transport.send_msg(response),
                };
                return HandlerState::Refusing(refusing);
            }
        }
    }
}


struct Accepting {
    send: sink::Send<ProtobufTransport<TcpStream>>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn poll(&mut self) -> Poll<ProtobufTransport<TcpStream>, io::Error> {
        self.send.poll()
    }

    fn step<R: Router>(mut self, transport: ProtobufTransport<TcpStream>)
        -> HandlerState<R>
    {
        self.handle.connect(transport);
        return HandlerState::Done;
    }
}

struct Refusing {
    send: sink::Send<ProtobufTransport<TcpStream>>,
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

pub struct ConnectionHandler<R: Router> {
    state: HandlerState<R>,
}

impl<R: Router> ConnectionHandler<R> {
    pub fn new(router: ConnectionRouter<R>,
               stream: TcpStream) -> Self
    {
        let transport = ProtobufTransport::new(stream);
        ConnectionHandler {
            state: HandlerState::Waiting(Waiting {
                transport,
                router,
            }),
        }
    }
}

impl<R: Router> ConnectionHandler<R> {
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

impl<R: Router> Future for ConnectionHandler<R> {
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