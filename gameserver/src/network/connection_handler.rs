use std::io;
use std::sync::{Arc, Mutex};
use futures::{Future, Stream, Sink, Poll, Async};
use futures::sync::mpsc;
use tokio::net::TcpStream;

use reactors::{WireEvent, ReactorCore};

use super::protobuf_codec::{ProtobufTransport, MessageStream};
use protocol::{Packet, packet, Event as ProtoEvent};

type PacketStream = MessageStream<TcpStream, Packet>;

pub enum TransportState {
    Disconnected,
    Connected(PacketStream),
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

    fn queue_send(&mut self, wire_event: WireEvent) {
        let payload = packet::Payload::Event(
            ProtoEvent {
                type_id: wire_event.type_id,
                data: wire_event.data,
            }
        );
        self.buffer.push(payload);
    }

    fn poll(&mut self, stream: &mut PacketStream)
        -> Poll<WireEvent, io::Error>
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
        -> Poll<WireEvent, io::Error>
    {
        loop {
            let packet = match try_ready!(stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            if let Some(payload) = packet.payload {
                match payload {
                    packet::Payload::Event(event) => {
                        return Ok(Async::Ready(WireEvent {
                            type_id: event.type_id,
                            data: event.data,
                        }));
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

pub struct ConnectionHandler<S> {
    transport_state: TransportState,
    state: ConnectionState,
    ctrl_chan: mpsc::UnboundedReceiver<ConnectionCommand>,
    core: ReactorCore<S>,
}

impl<S> ConnectionHandler<S> {
    pub fn new(core: ReactorCore<S>) -> (ConnectionHandle, Self) {
        let (snd, rcv) = mpsc::unbounded();

        let handle = ConnectionHandle { sender: snd };

        let handler = ConnectionHandler {
            transport_state: TransportState::Disconnected,
            state: ConnectionState::new(),
            ctrl_chan: rcv,
            core,
        };

        return (handle, handler);
    }

    fn poll_ctl_chan(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                None => {
                    panic!("ctrl channel dropped!");
                }
                Some(ConnectionCommand::Connect(transport)) => {
                    // TODO
                    unimplemented!()
                }
                Some(ConnectionCommand::Send(wire_event)) => {
                    // TODO
                    unimplemented!()
                }
            }
        }
    }

    fn poll_complete(&mut self) -> Poll<(), ()> {
        let stream = match self.transport_state {
            TransportState::Disconnected => {
                // When the connection is not connected to a client,
                // act as if the connection has completed. This is almost
                // certainly not what we want, but failing to do this would
                // yield in possibly infinite waits in the game server.
                // We should properly handle this with a re-connect time-out
                // or something similar.
                return Ok(Async::Ready(()));
            }
            TransportState::Connected(stream) => stream,
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
}

impl<S> Future for ConnectionHandler<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        unimplemented!()
    }
}

pub enum ConnectionCommand {
    Connect(ProtobufTransport<TcpStream>),
    Send(WireEvent),
}

#[derive(Clone)]
pub struct ConnectionHandle {
    sender: mpsc::UnboundedSender<ConnectionCommand>,
}

impl ConnectionHandle {
    fn send_command(&mut self, cmd: ConnectionCommand) {
        self.sender
            .unbounded_send(cmd)
            .expect("control channel dropped");
    }

    pub fn connect(&mut self, transport: ProtobufTransport<TcpStream>) {
        self.send_command(ConnectionCommand::Connect(transport));
    }

    pub fn send(&mut self, event: WireEvent) {
        self.send_command(ConnectionCommand::Send(event));
    }
}
