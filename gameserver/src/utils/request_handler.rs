// TODO: this does not really belong in utils.

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::io;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use network::router::RoutingTable;
use network::connection::Connection;

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ConnectionId {
    pub connection_num: usize,
}

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct MessageId {
    pub message_number: u64,
}

pub struct Event<RequestData> {
    pub connection_id: ConnectionId,
    pub content: EventContent<RequestData>,
}

pub enum EventContent<RequestData> {
    Connected,
    Disconnected,
    Message {
        message_id: MessageId,
        data: Vec<u8>,
    },
    Response {
        request_data: RequestData,
        value: ResponseValue,
    }
}

/// The result of a response
pub type ResponseValue = Result<Vec<u8>, ResponseError>;

pub enum ResponseError {
    /// Indicates that a response did not arrive in time
    Timeout,
}

pub enum Command<RequestData> {
    Message {
        data: Vec<u8>
    },
    Request {
        request_data: RequestData,
        message: Vec<u8>,
        deadline: Instant,
    },
}


pub struct ConnectionHandler<RequestData> {
    connection_id: ConnectionId,

    connection: Connection,

    ctrl_chan: UnboundedReceiver<Command<RequestData>>,
    ctrl_handle: UnboundedSender<Command<RequestData>>,
    
    event_channel: UnboundedSender<Event<RequestData>>,
}

impl<RequestData> ConnectionHandler<RequestData> {
    pub fn new(connection_id: ConnectionId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               event_channel: UnboundedSender<Event<RequestData>>)
               -> Self
    {
        let (snd, rcv) = unbounded();

        return ConnectionHandler {
            connection_id,

            connection: Connection::new(token, routing_table),

            ctrl_chan: rcv,
            ctrl_handle: snd,

            event_channel,
        };
    }

    /// Get a handle to the control channel for this client.
    pub fn handle(&self) -> UnboundedSender<Command<RequestData>> {
        self.ctrl_handle.clone()
    }

    /// Send a message to the game this controller serves.
    fn dispatch_event(&mut self, content: EventContent<RequestData>) {
        let event = Event {
            connection_id: self.connection_id,
            content,
        };
        self.event_channel.unbounded_send(event)
            .expect("event channel broke");
    }

    fn poll_ctrl_chan(&mut self) -> Poll<Command<RequestData>, ()> {
        // we hold a handle to this channel, so it can never close.
        // this means errors can not happen.
        let value = self.ctrl_chan.poll().unwrap();
        return Ok(value.map(|item| item.unwrap()));
    }

    /// Pull commands from the control channel and execute them.
    fn handle_commands(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.poll_ctrl_chan()) {
                Command::Message { data } => {
                   self.connection.send(data);
                },
                Command::Request { message, request_data, deadline } => {
                    // TODO
                }
            }
        }
    }

    fn poll_client_connection(&mut self) -> Poll<(), io::Error> {
        try!(self.connection.flush_buffer());
        loop {
            let item = try_ready!(self.connection.poll_message());
            if let Some(msg) = item {
                self.handle_client_message(msg);
            }
        }
    }
 
    fn handle_client_message(&mut self, msg: Vec<u8>) {
        // TODO
    }
}

impl<RequestData> Future for ConnectionHandler<RequestData> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match try!(self.handle_commands()) {
            // ignore the client for now, close the connection when we are done
            Async::Ready(()) => return Ok(Async::Ready(())),
            Async::NotReady => (),
        };
        let res = self.poll_client_connection();
        if let Err(_err) = res {
            // TODO: well
        }
        
        // TODO: proper exit
        Ok(Async::NotReady)
    }
}