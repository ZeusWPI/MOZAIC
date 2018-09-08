// TODO: tidy up this entire thing!

use std::io;
use futures::{Future, Stream, Sink, Poll, Async};
use futures::sync::mpsc;
use tokio::net::TcpStream;

use reactors::{Event, EventBox, WireEvent, EventHandler};

use super::protobuf_codec::{ProtobufTransport, MessageStream};
use protocol::{Packet, packet, Request, Response, CloseConnection};
use protocol::packet::Payload;
use events;

type PacketStream = MessageStream<TcpStream, Packet>;

pub enum TransportState {
    Disconnected,
    Connected(Transport),
}

pub struct Transport {
    stream: PacketStream,
    send_pos: usize,
}

impl Transport {
    fn send_messages(&mut self, state: &mut ConnectionState)
        -> Poll<(), io::Error> {
        while self.send_pos < state.pos() {
            try_ready!(self.stream.poll_complete());
            let payload = state.get_message(self.send_pos);
            let packet = Packet {
                seq_num: self.send_pos as u32,
                ack_num: state.ack_num,
                payload: Some(payload),
            };
            let res = try!(self.stream.start_send(packet));
            assert!(res.is_ready(), "writing to PacketStream blocked");
            self.send_pos += 1;
        }
        return self.stream.poll_complete();
    }

    fn receive_message(&mut self, state: &mut ConnectionState)
        -> Poll<NetworkMessage, io::Error>
    {
        loop {
            let packet = match try_ready!(self.stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            state.receive(&packet);

            match packet.payload {
                Some(payload) => return Ok(Async::Ready(NetworkMessage {
                    seq_num: packet.seq_num,
                    payload,
                })),
                None => {},
            }
        }

    }

    fn poll(&mut self, state: &mut ConnectionState)
        -> Poll<NetworkMessage, io::Error>
    {
        try!(self.send_messages(state));
        return self.receive_message(state);
    }
}

pub struct ConnectionState {
    status: ConnectionStatus,

    /// how many messages have already been flushed from the buffer
    seq_offset: usize,

    /// the send window
    buffer: Vec<Payload>,

    /// ack number for packets that we send
    ack_num: u32,
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
            seq_offset: 0,
            ack_num: 0,
            buffer: Vec::new(),
        }
    }

    fn pos(&self) -> usize {
        self.seq_offset + (self.buffer.len())
    }

    fn get_message(&self, seq_num: usize) -> Payload {
        // TODO: can this clone be avoided?
        self.buffer[seq_num - self.seq_offset].clone()
    }

    fn buffer_message(&mut self, payload: Payload) {
        self.buffer.push(payload);
    }

    fn send_request(&mut self, wire_event: WireEvent) -> u32 {
        self.buffer_message(Payload::Request(
            Request {
                type_id: wire_event.type_id,
                data: wire_event.data,
            }
        ));
        return self.pos() as u32;
    }

    fn send_response(&mut self, response: Response) {
        self.buffer_message(Payload::Response(response))
    }

    /// close this end of the connection
    fn close(&mut self) {
        self.status = ConnectionStatus::Closing;
        let close = CloseConnection {};
        self.buffer_message(Payload::CloseConnection(close));
    }

    fn receive(&mut self, packet: &Packet) {
        self.ack_num = packet.seq_num + 1;

        let ack_num = packet.ack_num as usize;

        if ack_num > self.seq_offset {
            self.buffer.drain(0..(ack_num - self.seq_offset));
            self.seq_offset = ack_num;
        }
    }
}

pub struct NetworkMessage {
    seq_num: u32,
    payload: Payload,
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
                Some(ConnectionCommand::Connect(conn)) => {
                    let t = Transport {
                        // TODO: properly get this somewhere
                        send_pos: self.state.seq_offset,
                        stream: MessageStream::new(conn),
                    };
                    self.transport_state = TransportState::Connected(t);
                    // TODO: can we work around this box?
                    self.event_handler.handle_event(
                        &EventBox::new(events::Connected {} )
                    );
                }
                Some(ConnectionCommand::Send(wire_event)) => {
                    self.state.send_request(wire_event);
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
            let message = try_ready!(transport.poll(&mut self.state));
            match message.payload {
                Payload::Request(request) => {
                    let res = self.event_handler.handle_wire_event(
                        WireEvent {
                            type_id: request.type_id,
                            data: request.data,
                        }
                    );
                    match res {
                        Ok(wire_event) => {
                            self.state.send_response(Response {
                                request_seq_num: message.seq_num,
                                type_id: wire_event.type_id,
                                data: wire_event.data,
                            });
                        }
                        Err(err) => {
                            panic!("handler error: {}", err);
                        }
                    }
                }
                Payload::Response(_response) => {
                    // discard responses for now
                }
                Payload::CloseConnection(_) => {
                    self.state.status = ConnectionStatus::Closed;
                }
            }
        }
    }

    fn poll_complete(&mut self) -> Poll<(), ()> {
        let transport = match self.transport_state {
            TransportState::Disconnected => {
                // When the connection is not connected to a client,
                // act as if the connection has completed. This is almost
                // certainly not what we want, but failing to do this would
                // yield in possibly infinite waits in the game server.
                // We should properly handle this with a re-connect time-out
                // or something similar.
                return Ok(Async::Ready(()));
            }
            TransportState::Connected(ref mut transport) => transport,
        };

        match transport.send_messages(&mut self.state) {
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
                        self.state.close();
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
