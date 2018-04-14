use std::io;
use std::sync::{Arc, Mutex};
use futures::{Stream, Sink, Poll, Async};
use futures::sync::mpsc::{UnboundedReceiver};
use tokio::net::TcpStream;


use super::router::{RoutingTable, RoutingMessage};
use protobuf_codec::MessageStream;
use protocol as proto;
use protocol::packet::Payload;

// TODO: move these structs somewhere else
pub struct Request {
    request_id: usize,
    data: Vec<u8>,
}

pub struct Response {
    request_id: usize,
    data: Vec<u8>,
}

pub enum Message {
    Request(Request),
    Response(Response),
}

type PacketStream = MessageStream<TcpStream, proto::Packet>;

pub enum StreamState {
    Disconnected,
    Connected(PacketStream),
}

struct StreamHandler {
    state: StreamState,
}

impl StreamHandler {
    fn new() -> Self {
        StreamHandler {
            state: StreamState::Disconnected,
        }
    }

    fn connect(&mut self, stream: PacketStream) {
        self.state = StreamState::Connected(stream);
    }

    fn poll_stream<'a>(&'a mut self) -> Poll<&'a mut PacketStream, io::Error> {
        let res = match self.state {
            StreamState::Disconnected => Async::NotReady,
            StreamState::Connected(ref mut stream) => Async::Ready(stream)
        };
        return Ok(res);
    }
}

pub struct Connection {
    /// The token that identifies this connection
    token: Vec<u8>,
    stream_handler: StreamHandler,
    buffer: Vec<Payload>,
    routing_chan: UnboundedReceiver<RoutingMessage>,

}

impl Connection {
    pub fn new(token: Vec<u8>, routing_table: Arc<Mutex<RoutingTable>>) -> Self
    {
        let mut router = routing_table.lock().unwrap();
        let routing_chan = router.register(&token);
        Connection {
            token,
            stream_handler: StreamHandler::new(),
            buffer: Vec::new(),
            routing_chan,
        }
    }

    pub fn send(&mut self, message: Message) {
        let payload = match message {
            Message::Request(request) => {
                Payload::Request(proto::Request {
                    request_id: request.request_id as u64,
                    data: request.data,
                })
            },
            Message::Response(response) => {
                Payload::Response(proto::Response {
                    request_id: response.request_id as u64,
                    data: response.data,
                })
            }
        };
        self.buffer.push(payload);
    }

    pub fn flush_buffer(&mut self) -> Poll<(), io::Error> {
        self.perform_routing();
        let stream = try_ready!(self.stream_handler.poll_stream());
        while !self.buffer.is_empty() {
            try_ready!(stream.poll_complete());
            let payload = self.buffer.remove(0);
            let packet = proto::Packet {
                payload: Some(payload),
            };
            let res = try!(stream.start_send(packet));
            assert!(res.is_ready(), "writing to PacketStream blocked");
        }
        return stream.poll_complete();
    }

    pub fn poll_message(&mut self) -> Poll<Option<Message>, io::Error> {
        self.perform_routing();
        let stream = try_ready!(self.stream_handler.poll_stream());
        loop {
            let packet = match try_ready!(stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            if let Some(payload) = packet.payload {
                match payload {
                    Payload::Request(request) => {
                        let r = Request {
                            request_id: request.request_id as usize,
                            data: request.data,
                        };
                        let message = Message::Request(r);
                        return Ok(Async::Ready(Some(message)));
                    },
                    Payload::Response(response) => {
                        // TODO: this can be done way nicer
                        let r = Response {
                            request_id: response.request_id as usize,
                            data: response.data,
                        };
                        let message = Message::Response(r);
                        return Ok(Async::Ready(Some(message)));
                    },
                    Payload::CloseConnection(_) => {
                        // TODO
                        println!("connection with token {:?} closed", self.token);
                    }
                }
            }
        };
    }

    fn perform_routing(&mut self) {
        loop {
            // unwrapping is fine because unbounded channels cannot error
            let msg = match self.routing_chan.poll().unwrap() {
                Async::Ready(Some(msg)) => msg,
                Async::Ready(None) => panic!("router channel closed"),
                Async::NotReady => return,
            };
            match msg {
                RoutingMessage::Connecting { stream } => {
                    self.stream_handler.connect(stream);
                }
            }
        }
    }
}