// TODO: tidy up this entire thing!

use std::io;
use futures::{Future, Stream, Sink, Poll, Async};
use futures::sync::mpsc;
use tokio::net::TcpStream;

use reactors::{Event, EventBox, WireEvent, EventHandler};

use super::protobuf_codec::{ProtobufTransport, MessageStream};
use protocol::{Packet, Request, Response, CloseRequest};
use protocol::packet::Payload;
use events;

type PacketStream = MessageStream<TcpStream, Packet>;

pub enum TransportState {
    Disconnected,
    Connected(Transport),
}

pub struct Transport {
    stream: PacketStream,
    last_seq_sent: u32,
    last_ack_sent: u32,
}

impl Transport {
    fn send_messages(&mut self, state: &mut ConnectionState)
        -> Poll<(), io::Error> {
        while self.last_seq_sent < state.pos() as u32 {
            let next_seq = self.last_seq_sent + 1;
            let payload = state.get_message(next_seq);
            let packet = Packet {
                seq_num: next_seq,
                ack_num: state.num_received,
                payload: Some(payload),
            };
            try_ready!(self.send_packet(packet));
        }

        if self.last_ack_sent < state.num_received {
            try_ready!(self.send_ack(state));
        }

        return self.stream.poll_complete();
    }

    fn send_ack(&mut self, state: &mut ConnectionState) -> Poll<(), io::Error> {
        let ack = Packet {
            seq_num: self.last_seq_sent,
            ack_num: state.num_received,
            payload: None,
        };
        return self.send_packet(ack);
    }

    fn send_packet(&mut self, packet: Packet) -> Poll<(), io::Error> {
        try_ready!(self.stream.poll_complete());
        self.last_seq_sent = packet.seq_num;
        self.last_ack_sent = packet.ack_num;
        let res = try!(self.stream.start_send(packet));
        assert!(res.is_ready(), "writing to PacketStream blocked");
        return Ok(Async::Ready(()));
    }

    fn receive_message(&mut self, state: &mut ConnectionState)
        -> Poll<NetworkMessage, io::Error>
    {
        loop {
            let packet = match try_ready!(self.stream.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(packet) => packet,
            };

            // TODO: how should these faulty cases be handled?
            // TODO: maybe this logic should be moved to ConnectionState
            if packet.seq_num < state.num_received {
                eprintln!("got retransmitted packet");
            } else if packet.seq_num == state.num_received {
                // this is an ack packet
                state.receive(&packet);
            } else if packet.seq_num == state.num_received + 1 {
                // this is the next packet in the stream
                state.receive(&packet);
                match packet.payload {
                    Some(payload) => return Ok(Async::Ready(NetworkMessage {
                        seq_num: packet.seq_num,
                        payload,
                    })),
                    None => {
                        eprintln!("packet has no payload");
                    },
                }
            } else {
                eprintln!("got out-of-order packet");
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

#[derive(Debug)]
pub enum ConnectionStatus {
    /// operating normally
    Open,
    /// We are requesting to close the connection
    RequestingClose,
    /// Remote party is requsting to close the connection,
    RemoteRequestingClose,
    /// The connection is considered closed
    Closed,
}

pub struct ConnectionState {
    /// how many packets have been flushed from the buffer
    num_flushed: usize,

    /// the send window
    buffer: Vec<Payload>,

    /// how many messages we already received
    num_received: u32,
}

impl ConnectionState {
    fn new() -> Self {
        ConnectionState {
            num_flushed: 0,
            num_received: 0,
            buffer: Vec::new(),
        }
    }

    fn pos(&self) -> usize {
        self.num_flushed + self.buffer.len()
    }

    fn get_message(&self, seq_num: u32) -> Payload {
        // TODO: can this clone be avoided?
        self.buffer[seq_num as usize - self.num_flushed - 1].clone()
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

    fn send_close_request(&mut self) {
        self.buffer_message(Payload::CloseRequest(CloseRequest {}));
    }

    fn receive(&mut self, packet: &Packet) {
        self.num_received = packet.seq_num;

        let mut ack_num = packet.ack_num as usize;

        if ack_num > self.pos() {
            eprintln!("Got ack for packet that was not sent yet");
            ack_num = self.pos();
        }

        if ack_num > self.num_flushed {
            self.buffer.drain(0..(ack_num - self.num_flushed));
            self.num_flushed = ack_num;
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
    status: ConnectionStatus,
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
            status: ConnectionStatus::Open,
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
                        last_seq_sent: self.state.num_flushed as u32,
                        // TODO: what should this value be?
                        last_ack_sent: 0,
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

    fn request_close(&mut self) {
        match self.status {
            ConnectionStatus::Open => {
                self.status = ConnectionStatus::RequestingClose;
                self.state.send_close_request();
            }
            ConnectionStatus::RemoteRequestingClose => {
                self.status = ConnectionStatus::Closed;
                self.state.send_close_request();
            }
            _ => {
                panic!("Calling request_close in illegal state");
            }
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
                Payload::CloseRequest(_) => {
                    // TODO: un-nest this
                    match self.status {
                        ConnectionStatus::Open => {
                            // TODO: can we work around this box?
                            self.event_handler.handle_event(
                                &EventBox::new(events::ConnectionClosed {} )
                            );
                            self.status = ConnectionStatus::RemoteRequestingClose;
                        }
                        ConnectionStatus::RequestingClose => {
                            // TODO: should we emit an event here?
                            self.status = ConnectionStatus::Closed;
                        }
                        _ => {
                            // TODO: dont panic
                            panic!("illegal close received");
                        }
                    }
                    // return ready to trigger state changes
                    // TODO: this is a bit of a hack, this should be implemented
                    // better!

                    return Ok(Async::Ready(()));
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
            match self.status {
                ConnectionStatus::Open | ConnectionStatus::RemoteRequestingClose=> {
                    if try!(self.poll_ctrl_chan()).is_ready() {
                        self.request_close();
                    }
                    try_ready!(self.receive_packets());
                }
                ConnectionStatus::RequestingClose => {
                    try_ready!(self.receive_packets());
                }
                ConnectionStatus::Closed => {
                    return self.poll_complete();
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
