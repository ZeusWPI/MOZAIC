use futures::{Future, Poll, Async, Stream};
use futures::sink::Send;
use futures::sync::mpsc::UnboundedSender;
use prost::Message;
use std::io;
use std::mem;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};

use super::protobuf_codec::{MessageStream, ProtobufTransport};
use super::connection_handler::ConnectionHandle;
use super::connection_table::{ConnectionTable};
use protocol as proto;



pub struct Listener {
    incoming: Incoming,
    connection_table: Arc<Mutex<ConnectionTable>>,
}

impl Listener {
    pub fn new(addr: &SocketAddr, connection_table: Arc<Mutex<ConnectionTable>>)
               -> io::Result<Self>
    {
        TcpListener::bind(addr).map(|tcp_listener| {
            Listener {
                connection_table,
                incoming: tcp_listener.incoming(),
            }
        })
    }

    fn handle_connections(&mut self) -> Poll<(), io::Error> {
        // just make sure the user is aware of this
        println!("Olivier is een letterlijke god");

        while let Some(raw_stream) = try_ready!(self.incoming.poll()) {
            let handler = ConnectionHandler::new(
                self.connection_table.clone(),
                raw_stream
            );
            tokio::spawn(handler);
        }
        return Ok(Async::Ready(()));
    }
}

impl Future for Listener {
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

struct Waiting {
    transport: ProtobufTransport<TcpStream>,
    connection_table: Arc<Mutex<ConnectionTable>>,
}

enum Action {
    Accept {
        handle: ConnectionHandle,
    },
    Refuse {
        reason: String,
    }
}

impl Waiting {
    fn poll(&mut self) -> Poll<Action, io::Error>
    {
        let bytes = match try_ready!(self.transport.poll()) {
            None => bail!(io::ErrorKind::ConnectionAborted),
            Some(bytes) => bytes.freeze(),
        };

        let request = try!(proto::ConnectionRequest::decode(bytes));

        let mut table = self.connection_table.lock().unwrap(); 
        let action = match table.get(&request.token) {
            None => Action::Refuse { reason: "invalid token".to_string() },
            Some(handle) => Action::Accept { handle },
        };
        return Ok(Async::Ready(action));
    }

    fn step(self, action: Action) -> HandlerState {
        match action {
            Action::Accept { handle } => {
                let response = connection_success();
                let accepting = Accepting {
                    send: self.transport.send_msg(response),
                    handle,
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
    send: Send<ProtobufTransport<TcpStream>>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn poll(&mut self) -> Poll<ProtobufTransport<TcpStream>, io::Error> {
        self.send.poll()
    }

    fn step(mut self, transport: ProtobufTransport<TcpStream>)
        -> HandlerState
    {
        self.handle.connect(transport);
        return HandlerState::Done;
    }
}

struct Refusing {
    send: Send<ProtobufTransport<TcpStream>>,
}

impl Refusing {
    fn poll(&mut self) -> Poll<(), io::Error> {
        try_ready!(self.send.poll());
        return Ok(Async::Ready(()));
    }

    fn step(self) -> HandlerState {
        return HandlerState::Done;
    }
}

enum HandlerState {
    Waiting(Waiting),
    Accepting(Accepting),
    Refusing(Refusing),
    Done,
}

pub struct ConnectionHandler {
    state: HandlerState,
}

impl ConnectionHandler {
    pub fn new(connection_table: Arc<Mutex<ConnectionTable>>,
               stream: TcpStream) -> Self
    {
        let transport = ProtobufTransport::new(stream);
        ConnectionHandler {
            state: HandlerState::Waiting(Waiting {
                transport,
                connection_table,
            }),
        }
    }
}

impl ConnectionHandler {
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

impl Future for ConnectionHandler {
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