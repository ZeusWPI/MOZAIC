// TODO: tidy up this entire thing!

use std::io;
use futures::{Future, Stream, Sink, Poll, Async};
use futures::sync::mpsc;
use tokio::net::TcpStream;

use reactors::{Event, EventBox, WireEvent, EventHandler};

use super::protobuf_codec::{ProtobufTransport, MessageStream};
use protocol::{Packet, packet, Request, Response, CloseConnection};
use events;

type PacketStream = MessageStream<TcpStream, Packet>;

// TODO: implement errors
pub enum ConnectionEvent {
    Request(Request),
    Response(Response),
}

pub enum TransportState {
    Disconnected,
    Connected(PacketStream),
}

pub struct ConnectionState {
    status: ConnectionStatus,
    seq_num: u32,
    buffer: Vec<packet::Payload>,
}

pub enum ConnectionStatus {
    /// operating normally
    Open,
    /// connection is being closed by the server
    Closing,
    /// connection has finished being connected
    Closed,
}

impl ConnectionState {
    fn new() -> Self {
        ConnectionState {
            status: ConnectionStatus::Open,
            seq_num: 0,
            buffer: Vec::new(),
        }
    }

    fn queue_send(&mut self, wire_event: WireEvent) -> u32 {
        let seq_num = self.seq_num;
        self.seq_num += 1;

        let payload = packet::Payload::Request(
            Request {
                seq_num,
                type_id: wire_event.type_id,
                data: wire_event.data,
            }
        );
        self.buffer.push(payload);
        return seq_num;
    }

    fn queue_response(&mut self, response: Response) {
        let payload = packet::Payload::Response(response);
        self.buffer.push(payload);
    }

    fn start_close(&mut self) {
        let payload = packet::Payload::CloseConnection(CloseConnection {});
        self.buffer.push(payload);
        self.status = ConnectionStatus::Closing;
    }

    fn poll(&mut self, stream: &mut PacketStream)
        -> Poll<ConnectionEvent, io::Error>
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
        -> Poll<ConnectionEvent, io::Error>
    {
        loop {
            let packet = match try_ready!(stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            if let Some(payload) = packet.payload {
                match payload {
                    packet::Payload::Request(request) => {
                        return Ok(
                            Async::Ready(
                                ConnectionEvent::Request(request)
                            )
                        );
                    },
                    packet::Payload::Response(response) => {
                        return Ok(
                            Async::Ready(
                                ConnectionEvent::Response(response)
                            )
                        );
                    }
                    packet::Payload::CloseConnection(_) => {
                        // TODO
                        println!("connection closed");
                    }
                }
            }
        };
    }
}

pub struct ConnectionHandler<H>
    where H: EventHandler<Output = io::Result<WireEvent>>
{
    connection_id: usize,
    transport_state: TransportState,
    state: ConnectionState,
    ctrl_chan: mpsc::UnboundedReceiver<ConnectionCommand>,
    event_handler: H,
}

impl<H> ConnectionHandler<H>
    where H: EventHandler<Output = io::Result<WireEvent>>
{
    pub fn new(connection_id: usize, event_handler: H)
        -> (ConnectionHandle, Self)
    {
        Self::create(connection_id, |_| event_handler)
    }

    pub fn create<F>(connection_id: usize, creator: F)
        -> (ConnectionHandle, Self)
        where F: FnOnce(ConnectionHandle) -> H
    {
        let (snd, rcv) = mpsc::unbounded();

        let handle = ConnectionHandle { connection_id, sender: snd };

        let event_handler = creator(handle.clone());

        let handler = ConnectionHandler {
            connection_id,
            transport_state: TransportState::Disconnected,
            state: ConnectionState::new(),
            ctrl_chan: rcv,
            event_handler,
        };

        return (handle, handler);
    }

    fn poll_ctrl_chan(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                None => {
                    // TODO: properly communicate that we are quiting
                    return Ok(Async::Ready(()));
                }
                Some(ConnectionCommand::Connect(transport)) => {
                    let t = MessageStream::new(transport);
                    self.transport_state = TransportState::Connected(t);
                    // TODO: can we work around this box?
                    self.event_handler.handle_event(
                        &EventBox::new(events::Connected {} )
                    );
                }
                Some(ConnectionCommand::Send(wire_event)) => {
                    self.state.queue_send(wire_event);
                }
            }
        }
    }

    fn receive_packets(&mut self) -> Poll<(), ()> {
        match self.poll_transport() {
            Err(_) => {
                // TODO: include error in disconnected event
                // TODO: can we work around this box?
                self.event_handler.handle_event(
                    &EventBox::new(events::Disconnected {} )
                );
                self.transport_state = TransportState::Disconnected;
                Ok(Async::NotReady)
            },
            Ok(poll) => Ok(poll),
        }
    }

    fn poll_transport(&mut self) -> Poll<(), io::Error> {
        let transport = match self.transport_state {
            TransportState::Disconnected => return Ok(Async::NotReady),
            TransportState::Connected(ref mut transport) => transport,
        };

        loop {
            let event = try_ready!(self.state.poll(transport));
            match event {
                ConnectionEvent::Request(request) => {
                    let res = self.event_handler.handle_wire_event(
                        WireEvent {
                            type_id: request.type_id,
                            data: request.data,
                        }
                    );
                    match res {
                        Ok(wire_event) => {
                            self.state.queue_response(Response {
                                seq_num: request.seq_num,
                                type_id: wire_event.type_id,
                                data: wire_event.data,
                            });
                        }
                        Err(err) => {
                            panic!("handler error: {}", err);
                        }
                    }
                }
                ConnectionEvent::Response(_response) => {
                    // discard responses for now
                }
            }
        }
    }

    fn poll_complete(&mut self) -> Poll<(), ()> {
        let mut stream = match self.transport_state {
            TransportState::Disconnected => {
                // When the connection is not connected to a client,
                // act as if the connection has completed. This is almost
                // certainly not what we want, but failing to do this would
                // yield in possibly infinite waits in the game server.
                // We should properly handle this with a re-connect time-out
                // or something similar.
                return Ok(Async::Ready(()));
            }
            TransportState::Connected(ref mut stream) => stream,
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

impl<H> Future for ConnectionHandler<H>
    where H: EventHandler<Output = io::Result<WireEvent>>
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            match self.state.status {
                ConnectionStatus::Open => {
                    if try!(self.poll_ctrl_chan()).is_ready() {
                        self.state.start_close();
                    }
                    try_ready!(self.receive_packets());
                }
                ConnectionStatus::Closing => {
                    try_ready!(self.receive_packets());
                }
                ConnectionStatus::Closed => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }
}

pub enum ConnectionCommand {
    Connect(ProtobufTransport<TcpStream>),
    Send(WireEvent),
}

#[derive(Clone)]
pub struct ConnectionHandle {
    connection_id: usize,
    sender: mpsc::UnboundedSender<ConnectionCommand>,
}

impl ConnectionHandle {
    fn send_command(&mut self, cmd: ConnectionCommand) {
        self.sender
            .unbounded_send(cmd)
            .expect("control channel dropped");
    }

    pub fn id(&self) -> usize {
        self.connection_id
    }

    pub fn connect(&mut self, transport: ProtobufTransport<TcpStream>) {
        self.send_command(ConnectionCommand::Connect(transport));
    }

    pub fn dispatch<E>(&mut self, event: E)
        where E: Event
    {
        // TODO: this converting should really be abstracted somewhere

        let mut buf = Vec::with_capacity(event.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        event.encode(&mut buf).unwrap();

        self.send(WireEvent {
            type_id: E::TYPE_ID,
            data:  buf,
        });
    }

    pub fn send(&mut self, event: WireEvent) {
        self.send_command(ConnectionCommand::Send(event));
    }
}
