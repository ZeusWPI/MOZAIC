use std::io;
use std::sync::{Arc, Mutex};
use futures::{Future, Stream, Sink, Poll, Async, AsyncSink};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use tokio_io::{AsyncRead, AsyncWrite};


use router::RoutingTable;
use protobuf_codec::MessageStream;
use protocol::{Packet, Message, CloseConnection};
use protocol::packet::Payload;


type PacketStream<T> = MessageStream<T, Packet>;

struct StreamHandler<T> {
    state: ConnectionState<T>,
}

impl <T> StreamHandler<T> {
    fn new() -> Self {
        StreamHandler {
            state: ConnectionState::Disconnected,
        }
    }

    fn poll_stream<'a>(&'a mut self) -> Poll<&'a mut PacketStream<T>, io::Error>
    {
        let res = match self.state {
            ConnectionState::Disconnected => Async::NotReady,
            ConnectionState::Connected(ref mut stream) => Async::Ready(stream)
        };
        return Ok(res);
    }
}

pub enum ConnectionCommand {
    Connect()
}

pub enum ConnectionState<T> {
    Disconnected,
    Connected(PacketStream<T>),
}

pub struct Connection<T> {
    /// The token that identifies this connection
    token: Vec<u8>,
    stream_handler: StreamHandler<T>,
    buffer: Vec<Vec<u8>>,
}

impl<T> Connection<T>
    where T: AsyncRead + AsyncWrite
{
    pub fn new(token: Vec<u8>) -> Self {
        Connection {
            token,
            stream_handler: StreamHandler::new(),
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