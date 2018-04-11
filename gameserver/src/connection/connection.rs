use std::io;
use std::sync::{Arc, Mutex};
use futures::{Stream, Sink, Poll, Async};
use futures::sync::mpsc::{UnboundedReceiver};
use tokio::net::TcpStream;


use super::router::{RoutingTable, RoutingMessage};
use protobuf_codec::MessageStream;
use protocol::{Packet, Message, CloseConnection};
use protocol::packet::Payload;


type PacketStream = MessageStream<TcpStream, Packet>;


struct StreamHandler {
    state: ConnectionState,
    routing_chan: UnboundedReceiver<RoutingMessage>,
}

impl StreamHandler {
    fn new(routing_chan: UnboundedReceiver<RoutingMessage>) -> Self {
        StreamHandler {
            state: ConnectionState::Disconnected,
            routing_chan,
        }
    }

    // TODO: maybe move this
    // TODO: can we handle these cases gracefully?
    fn poll_routing_chan(&mut self) -> Poll<RoutingMessage, io::Error> {
        let res = match self.routing_chan.poll() {
            Ok(Async::Ready(Some(msg))) => Async::Ready(msg),
            Ok(Async::Ready(None)) => panic!("router channel dropped"),
            Ok(Async::NotReady) => Async::NotReady,
            Err(_) => panic!("something really bad happened"),
        };
        return Ok(res);
    }

    fn perform_routing(&mut self) -> Poll<(), io::Error> {
        loop {
            match try_ready!(self.poll_routing_chan()) {
                RoutingMessage::Connecting { stream } => {
                    self.state = ConnectionState::Connected(stream);
                }
            }
        }
    }

    fn poll_stream<'a>(&'a mut self) -> Poll<&'a mut PacketStream, io::Error> {
        try!(self.perform_routing());
        let res = match self.state {
            ConnectionState::Disconnected => Async::NotReady,
            ConnectionState::Connected(ref mut stream) => Async::Ready(stream)
        };
        return Ok(res);
    }
}


pub enum ConnectionState {
    Disconnected,
    Connected(PacketStream),
}

pub struct Connection {
    /// The token that identifies this connection
    token: Vec<u8>,
    stream_handler: StreamHandler,
    buffer: Vec<Vec<u8>>,
}

impl Connection {
    pub fn new(token: Vec<u8>, routing_table: Arc<Mutex<RoutingTable>>) -> Self
    {
        let mut router = routing_table.lock().unwrap();
        let routing_chan = router.register(&token);
        Connection {
            token,
            stream_handler: StreamHandler::new(routing_chan),
            buffer: Vec::new(),
        }
    }

    pub fn send(&mut self, message: Vec<u8>) -> Poll<(), io::Error> {
        self.buffer.push(message);
        return self.flush_buffer();
    }

    pub fn flush_buffer(&mut self) -> Poll<(), io::Error> {
        let stream = try_ready!(self.stream_handler.poll_stream());
        while !self.buffer.is_empty() {
            try_ready!(stream.poll_complete());
            let message = self.buffer.remove(0);
            // toDO: put this somewhere else
            let packet = Packet {
                payload: Some(
                    Payload::Message(
                        Message {
                            data: message,
                        }
                    )
                )
            };
            let res = try!(stream.start_send(packet));
            assert!(res.is_ready(), "writing to PacketStream blocked");
        }
        return stream.poll_complete();
    }

    pub fn poll_message(&mut self) -> Poll<Option<Vec<u8>>, io::Error> {
        let stream = try_ready!(self.stream_handler.poll_stream());
        loop {
            let packet = match try_ready!(stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            if let Some(payload) = packet.payload {
                match payload {
                    Payload::Message(message) => {
                        return Ok(Async::Ready(Some(message.data)));
                    },
                    Payload::CloseConnection(_) => {
                        // TODO
                        println!("connection with token {:?} closed", self.token);
                    }
                }
            }
        };
    }
}