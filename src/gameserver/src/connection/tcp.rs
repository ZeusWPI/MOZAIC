use bytes::BytesMut;
use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::UnboundedSender;
use prost::Message;
use std::io;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};

use protobuf_codec::{MessageStream, ProtobufTransport};
use protocol;
use super::router::{RoutingTable, RoutingMessage};
use connection::utils::Sender;



pub struct Listener {
    incoming: Incoming,
    routing_table: Arc<Mutex<RoutingTable>>,
}

impl Listener {
    pub fn new(addr: &SocketAddr, routing_table: Arc<Mutex<RoutingTable>>)
               -> io::Result<Self>
    {
        TcpListener::bind(addr).map(|tcp_listener| {
            Listener {
                routing_table,
                incoming: tcp_listener.incoming(),
            }
        })
    }

    fn handle_connections(&mut self) -> Poll<(), io::Error> {
        while let Some(raw_stream) = try_ready!(self.incoming.poll()) {
            let handler = ConnectionHandler::new(
                self.routing_table.clone(),
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


struct Waiting;

impl Waiting {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        let bytes = match try_ready!(data.conn_mut().poll()) {
            None => bail!(io::ErrorKind::ConnectionAborted),
            Some(bytes) => bytes.freeze(),
        };

        let request = try!(protocol::ConnectionRequest::decode(bytes));

        let mut table = data.routing_table.lock().unwrap();
        let handle = match table.get(&request.token) {
            None => panic!("invalid token"),
            Some(handle) => handle,
        };
        
        let response = protocol::ConnectionResponse {
            response: Some(
                protocol::connection_response::Response::Success(
                    protocol::ConnectionSuccess {}
                )
            )
        };
        let mut buf = BytesMut::new();
        try!(response.encode(&mut buf));

        let accepting = Accepting {
            send: Sender::new(buf),
            handle,
        };
        return Ok(Async::Ready(HandlerState::Accepting(accepting)));
    }
}


struct Accepting {
    send: Sender<BytesMut>,
    handle: UnboundedSender<RoutingMessage>,
}

impl Accepting {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        try_ready!(self.send.poll_send(data.conn_mut()));
        self.handle.unbounded_send(RoutingMessage::Connecting {
            stream: MessageStream::new(data.transport.take().unwrap())
        }).unwrap();
        return Ok(Async::Ready(HandlerState::Done));
    }
}

enum HandlerState {
    Waiting(Waiting),
    Accepting(Accepting),
    Done,
}

impl HandlerState {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        match *self {
            HandlerState::Waiting(ref mut waiting) => waiting.poll(data),
            HandlerState::Accepting(ref mut accepting) => accepting.poll(data),
            HandlerState::Done => panic!("polling Done"),
        }
    }
}

struct HandlerData {
    transport: Option<ProtobufTransport<TcpStream>>,
    routing_table: Arc<Mutex<RoutingTable>>,
}

impl HandlerData {
    // TODO: this might not be the ideal solution ...
    fn conn_mut<'a>(&'a mut self) -> &'a mut ProtobufTransport<TcpStream> {
        match self.transport.as_mut() {
            Some(conn) => conn,
            None => panic!("Connection moved"),
        }
    }
}

pub struct ConnectionHandler {
    state: HandlerState,
    data: HandlerData,
}

impl ConnectionHandler {
    pub fn new(routing_table: Arc<Mutex<RoutingTable>>,
               stream: TcpStream) -> Self
    {
        let transport = ProtobufTransport::new(stream);
        ConnectionHandler {
            state: HandlerState::Waiting(Waiting),
            data: HandlerData {
                transport: Some(transport),
                routing_table,
            }
        }
    }
}

impl Future for ConnectionHandler {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let data = &mut self.data;
        loop {
            match self.state.poll(data) {
                // TODO: handle this case gracefully
                Err(err) => panic!("error: {}", err),
                Ok(Async::NotReady) => return Ok(Async::NotReady),
                Ok(Async::Ready(state)) => {
                    match state {
                        HandlerState::Done => return Ok(Async::Ready(())),
                        new_state => self.state = new_state,
                    }
                }
            }
        }
    }
}