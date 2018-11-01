// TODO: tidy up this entire thing!

use std::io;
use futures::{Future, Stream, Poll, Async};
use futures::sync::mpsc;

use network::lib::crypto::SessionKeys;
use network::lib::channel::Channel;

use super::transport::Transport;
use super::connection_state::ConnectionState;


trait Handler {
    fn on_connect(&mut self);
    fn on_disconnect(&mut self);
    fn on_close(&mut self);
    fn on_message(&mut self, data: Vec<u8>);
}


pub enum TransportState {
    Disconnected,
    Connected(Transport),
}


// TODO: find a better name for this
pub struct ConnectionHandler<H>
    where H: Handler
{
    state: ConnectionState,
    handler: H,
    transport_state: TransportState,
    ctrl_chan: mpsc::UnboundedReceiver<ConnectionCommand>,
}

impl<H> ConnectionHandler<H>
    where H: Handler
{
    pub fn new(handler: H)
        -> (ConnectionHandle, Self)
    {
        Self::create(|_| handler)
    }

    pub fn create<F>(creator: F)
        -> (ConnectionHandle, Self)
        where F: FnOnce(ConnectionHandle) -> H
    {
        let (snd, rcv) = mpsc::unbounded();

        let handle = ConnectionHandle { sender: snd };

        let handler = creator(handle.clone());

        let conn_handler = ConnectionHandler {
            handler,
            state: ConnectionState::new(),
            transport_state: TransportState::Disconnected,
            ctrl_chan: rcv,
        };

        return (handle, conn_handler);
    }

    fn poll_ctrl_chan(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                None => {
                    // TODO: properly communicate that we are quiting
                    return Ok(Async::Ready(()));
                }
                Some(ConnectionCommand::Connect { channel, keys }) => {
                    let t = Transport::new(channel, keys, &self.state);
                    self.transport_state = TransportState::Connected(t);
                    self.handler.on_connect();
                }
                Some(ConnectionCommand::Send(data)) => {
                    self.state.buffer_message(data);
                }
            }
        }
    }

    fn receive_packets(&mut self) -> Poll<(), ()> {
        match self.poll_transport() {
            Err(_) => {
                // TODO: pass error
                self.handler.on_disconnect();
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
            match try!(transport.poll(&mut self.state)) {
                Async::Ready(data) => {
                    self.handler.on_message(data);
                }
                Async::NotReady => {
                    // TODO: check for close
                    return Ok(Async::NotReady);
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
    where H: Handler
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            if try!(self.poll_ctrl_chan()).is_ready() {
                self.state.should_close = true;
            }
            
            // TODO: this could probably be simplified even further
            if self.state.is_closed() {
                return self.poll_complete();
            } else {
                try_ready!(self.receive_packets());
            }
        }
    }
}

pub enum ConnectionCommand {
    Connect {
        channel: Channel,
        keys: SessionKeys,
    },
    Send(Vec<u8>),
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

    pub fn connect(&mut self, channel: Channel, keys: SessionKeys) {
        self.send_command(ConnectionCommand::Connect { channel, keys });
    }

    pub fn send(&mut self, data: Vec<u8>) {
        // TODO: this converting should really be abstracted somewhere

        self.send_command(ConnectionCommand::Send(data));
    }
}
