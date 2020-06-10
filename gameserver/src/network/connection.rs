use std::io;
use std::sync::{Arc, Mutex};
use futures::{Stream, Sink, Poll, Async};
use futures::sync::mpsc::{UnboundedReceiver};
use tokio::net::TcpStream;


use super::router::{RoutingTable, RoutingMessage, ClientId};
use protobuf_codec::MessageStream;
use protocol::{Packet, packet};

pub enum ConnectionEvent {
    Connected,
    Packet(Vec<u8>),
    Disconnected,
}

pub struct ConnectionState {
    buffer: Vec<packet::Payload>,
}

impl ConnectionState {
    fn new() -> Self {
        ConnectionState {
            buffer: Vec::new(),
        }
    }

    fn queue_send(&mut self, data: Vec<u8>) {
        let payload = packet::Payload::Message(packet::Message { data });
        self.buffer.push(payload);
    }

    fn poll(&mut self, stream: &mut PacketStream)
        -> Poll<Option<Vec<u8>>, io::Error>
    {
        try!(self.flush_buffer(stream));
        return self.poll_message(stream);
    }

    pub fn flush_buffer(&mut self, stream: &mut PacketStream)
        -> Poll<(), io::Error>
    {
        while !self.buffer.is_empty() {
            try_ready!(stream.poll_complete());
            let payload = self.buffer.remove(0);
            let packet = Packet {
                payload: Some(payload),
            };
            let res = try!(stream.start_send(packet));
            assert!(res.is_ready(), "writing to PacketStream blocked");
        }
        return stream.poll_complete();
    }

    fn poll_message(&mut self, stream: &mut PacketStream)
        -> Poll<Option<Vec<u8>>, io::Error>
    {
        loop {
            let packet = match try_ready!(stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            if let Some(payload) = packet.payload {
                match payload {
                    packet::Payload::Message(message) => {
                        return Ok(Async::Ready(Some(message.data)))
                    },
                    packet::Payload::CloseConnection(_) => {
                        // TODO
                        println!("connection closed");
                    }
                }
            }
        };
    }
}

type PacketStream = MessageStream<TcpStream, Packet>;

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

    fn disconnect(&mut self) {
        self.state = StreamState::Disconnected;
    }

    fn poll_stream<'a>(&'a mut self) -> Poll<&'a mut PacketStream, ()> {
        let res = match self.state {
            StreamState::Disconnected => Async::NotReady,
            StreamState::Connected(ref mut stream) => Async::Ready(stream)
        };
        return Ok(res);
    }
}

pub struct Connection {
    token: Vec<u8>,
    stream_handler: StreamHandler,
    state: ConnectionState,
    routing_chan: UnboundedReceiver<RoutingMessage>,
}

impl Connection {
    pub fn new(token: Vec<u8>,
               client_id: ClientId,
               routing_table: Arc<Mutex<RoutingTable>>)
               -> Self
    {
        let mut router = routing_table.lock().unwrap();
        let routing_chan = router.register(&token, client_id);
        Connection {
            token,
            stream_handler: StreamHandler::new(),
            state: ConnectionState::new(),
            routing_chan,
        }
    }

    pub fn send(&mut self, data: Vec<u8>) {
        self.state.queue_send(data);
    }

    // TODO:
    // Are there any errors that will have to be propagated?
    // What is the cleanest way to go about this?
    // How do we handle a closed connection?
    pub fn poll(&mut self) -> Poll<ConnectionEvent, ()> {
        match self.poll_routing_chan() {
            Async::Ready(RoutingMessage::Connecting {stream} ) => {
                self.stream_handler.connect(stream);
                // TODO: what is the desired behaviour when there was another
                // connected stream already?
                return Ok(Async::Ready(ConnectionEvent::Connected));
            }
            Async::NotReady => {}
        }

        // TODO: can this be extracted into a helper?
        let res = {
            let stream = try_ready!(self.stream_handler.poll_stream());
            self.state.poll(stream)
        };

        match res { 
            Ok(Async::Ready(item)) => {
                let msg = item.unwrap(); // TODO
                return Ok(Async::Ready(ConnectionEvent::Packet(msg)))
            }
            Ok(Async::NotReady) => {
                return Ok(Async::NotReady)
            }
            Err(_err) => {
                self.stream_handler.disconnect();
                return Ok(Async::Ready(ConnectionEvent::Disconnected));
            }
        }
    }

    pub fn poll_complete(&mut self) -> Poll<(), ()> {
        let mut stream = match try!(self.stream_handler.poll_stream()) {
            Async::Ready(stream) => stream,
            Async::NotReady => {
                // When the connection is not connected to a client,
                // act as if the connection has completed. This is almost
                // certainly not what we want, but failing to do this would
                // yield in possibly infinite waits in the game server.
                // We should properly handle this with a re-connect time-out
                // or something similar.
                return Ok(Async::Ready(()));
            }
        };

        match self.state.flush_buffer(&mut stream) {
            Ok(async) => return Ok(async),
            Err(_err) => {
                // ignore the error and act as if the stream has completed.
                // TODO: this should be handled better.
                return Ok(Async::Ready(()));
            },
        }
    }

    fn poll_routing_chan(&mut self) -> Async<RoutingMessage> {
        match self.routing_chan.poll().unwrap() {
            Async::Ready(Some(msg)) => Async::Ready(msg),
            Async::Ready(None) => panic!("router channel closed"),
            Async::NotReady => Async::NotReady,
        }
    }
}