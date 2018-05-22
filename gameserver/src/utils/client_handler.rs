// TODO: this does not really belong in utils.

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::sync::{Arc, Mutex};
use std::time::Instant;

use network::router::RoutingTable;
use network::connection::{Connection, ConnectionEvent};
use super::message_handler::*;

pub use super::message_handler::MessageId;


#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ClientId(pub u64);

pub struct ClientHandle {
    client_id: ClientId,
    ctrl_chan: UnboundedSender<Command>,
    request_counter: usize,
}

impl ClientHandle {
    pub fn id(&self) -> ClientId {
        self.client_id
    }

    pub fn send(&mut self, data: Vec<u8>) {
        let cmd = Command::Message { data };
        self.send_command(cmd);
    }

    pub fn request(&mut self, data: Vec<u8>, deadline: Instant) -> RequestId {
        let request_num = self.request_counter;
        self.request_counter += 1;

        let cmd = Command::Request { request_num, data, deadline };
        self.send_command(cmd);

        return RequestId { request_num, client_id: self.client_id };
    }

    pub fn respond(&mut self, message_id: MessageId, data: Vec<u8>) {
        let cmd = Command::Response { message_id, data };
        self.send_command(cmd);
    }

    fn send_command(&mut self, command: Command) {
        self.ctrl_chan.unbounded_send(command)
            .expect("connection handle broke");
    }
}

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct RequestId {
    client_id: ClientId,
    request_num: usize,
}

pub struct Event {
    pub client_id: ClientId,
    pub content: EventContent,
}

pub enum EventContent {
    Connected,
    Disconnected,
    Message {
        message_id: MessageId,
        data: Vec<u8>,
    },
    Response {
        request_id: RequestId,
        value: ResponseValue,
    }
}

/// The result of a response
pub type ResponseValue = Result<Vec<u8>, ResponseError>;

pub enum ResponseError {
    /// Indicates that a response did not arrive in time
    Timeout,
}

pub enum Command {
    Message {
        data: Vec<u8>
    },
    Request {
        request_num: usize,
        data: Vec<u8>,
        deadline: Instant,
    },
    Response {
        message_id: MessageId,
        data: Vec<u8>,
    }
}


pub struct ClientHandler {
    client_id: ClientId,

    connection: Connection,

    ctrl_chan: UnboundedReceiver<Command>,

    message_handler: MessageHandler,
    
    event_channel: UnboundedSender<Event>,
}

impl ClientHandler {
    pub fn new(client_id: ClientId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               event_channel: UnboundedSender<Event>)
               -> (ClientHandle, ClientHandler)
    {
        let (snd, rcv) = unbounded();

        let handle = ClientHandle {
            client_id,
            ctrl_chan: snd,
            request_counter: 0,
        };

        let handler = ClientHandler {
            client_id,

            connection: Connection::new(token, routing_table),

            ctrl_chan: rcv,

            message_handler: MessageHandler::new(),

            event_channel,
        };

        return (handle, handler);
    }

    /// Send a message to the game this controller serves.
    fn dispatch_event(&mut self, content: EventContent) {
        let event = Event {
            client_id: self.client_id,
            content,
        };
        self.event_channel.unbounded_send(event)
            .expect("event channel broke");
    }

    /// Pull commands from the control channel and execute them.
    fn handle_commands(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(Command::Message { data }) => {
                    let msg = self.message_handler.create_message(data);
                    self.connection.send(msg);
                },
                Some(Command::Request { request_num, data, deadline }) => {
                    let msg = self.message_handler.create_request(
                        request_num,
                        data,
                        deadline,
                    );
                    self.connection.send(msg);
                },
                Some(Command::Response { message_id, data }) => {
                    let msg = self.message_handler.create_response(
                        message_id,
                        data
                    );
                    self.connection.send(msg);
                }
                None => {
                    // The control channel was closed; exit.
                    // return Ok(Async::Ready(()));
                    return Ok(Async::NotReady);
                }
            }
        }
    }

    /// Pull events from the client connection and handle them.
    fn poll_client_connection(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.connection.poll()) {
                ConnectionEvent::Packet(data) => {
                    self.handle_packet(data);
                }
                ConnectionEvent::Connected => {
                    self.dispatch_event(EventContent::Connected);
                }
                ConnectionEvent::Disconnected => {
                    self.dispatch_event(EventContent::Disconnected);
                }
            }
        }
    }

    /// Check for request timeouts, and dispatch them.
    fn handle_timeouts(&mut self) -> Poll<(), ()> {
        loop {
            let request_num = try_ready!(self.message_handler.poll_timeout());
            let client_id = self.client_id;
            let request_id = RequestId { client_id, request_num };

            self.dispatch_event(EventContent::Response {
                request_id,
                value: Err(ResponseError::Timeout),
            });
        }
    }

    fn handle_packet(&mut self, data: Vec<u8>) {
        match self.message_handler.handle_message(data) {
            Ok(Message::Message { message_id, data }) => {
                self.dispatch_event(EventContent::Message {
                    message_id,
                    data,
                });
            }
            Ok(Message::Response { request_num, data }) => {
                let client_id = self.client_id;
                let request_id = RequestId { client_id, request_num };
                self.dispatch_event(EventContent::Response {
                    request_id,
                    value: Ok(data),
                });
            }
            Err(err) => {
                // TODO
                println!("{}", err);
            }
        }
    }
}

impl Future for ClientHandler {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match try!(self.handle_commands()) {
            // drop the connection as soon as it is done
            Async::Ready(()) => return self.connection.poll_complete(),
            Async::NotReady => (),
        };
        try!(self.handle_timeouts());
        return self.poll_client_connection();
    }
}