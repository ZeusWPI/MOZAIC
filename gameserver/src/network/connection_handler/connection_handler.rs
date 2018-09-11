// TODO: tidy up this entire thing!

use std::io;
use futures::{Future, Stream, Poll, Async};
use futures::sync::mpsc;

use reactors::{Event, EventBox, WireEvent, EventHandler};

use protocol::Response;
use protocol::packet::Payload;
use events;
use network::tcp::Channel;


use super::transport::Transport;
use super::connection_state::{ConnectionState, ConnectionStatus};



pub enum TransportState {
    Disconnected,
    Connected(Transport),
}


pub struct ConnectionHandler<H>
    where H: EventHandler<Output = io::Result<WireEvent>>
{
    connection_id: usize,
    state: ConnectionState,
    request_handler: H,
    transport_state: TransportState,
    ctrl_chan: mpsc::UnboundedReceiver<ConnectionCommand>,
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

        let request_handler = creator(handle.clone());

        let handler = ConnectionHandler {
            connection_id,
            request_handler,
            state: ConnectionState::new(),
            transport_state: TransportState::Disconnected,
            ctrl_chan: rcv,
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
                Some(ConnectionCommand::Connect(channel)) => {
                    let t = Transport::new(channel, &self.state);
                    self.transport_state = TransportState::Connected(t);
                    // TODO: can we work around this box?
                    self.request_handler.handle_event(
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
                self.request_handler.handle_event(
                    &EventBox::new(events::Disconnected {} )
                );
                self.transport_state = TransportState::Disconnected;
                Ok(Async::NotReady)
            },
            Ok(poll) => Ok(poll),
        }
    }

    // TODO: clean up this method
    fn poll_transport(&mut self) -> Poll<(), io::Error> {
        let transport = match self.transport_state {
            TransportState::Disconnected => return Ok(Async::NotReady),
            TransportState::Connected(ref mut transport) => transport,
        };

        loop {
            let message = try_ready!(transport.poll(&mut self.state));
            match message.payload {
                Payload::Request(request) => {
                    let res = self.request_handler.handle_wire_event(
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
                    match self.state.status {
                        ConnectionStatus::Open => {
                            // TODO: can we work around this box?
                            self.request_handler.handle_event(
                                &EventBox::new(events::ConnectionClosed {} )
                            );
                            self.state.status = ConnectionStatus::RemoteRequestingClose;
                        }
                        ConnectionStatus::RequestingClose => {
                            // TODO: should we emit an event here?
                            self.state.status = ConnectionStatus::Closed;
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
            match self.state.status {
                ConnectionStatus::Open | ConnectionStatus::RemoteRequestingClose=> {
                    if try!(self.poll_ctrl_chan()).is_ready() {
                        self.state.request_close();
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
    Connect(Channel),
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

    pub fn connect(&mut self, channel: Channel) {
        self.send_command(ConnectionCommand::Connect(channel));
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
