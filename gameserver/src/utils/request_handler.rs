// TODO: this does not really belong in utils.

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use std::collections::HashMap;

use network::router::RoutingTable;
use network::connection::{Connection, ConnectionEvent};

use utils::timeout_heap::TimeoutHeap;

use prost::Message as ProtobufMessage;
use bytes::BytesMut;
use protocol::{self as proto, message};


#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ConnectionId {
    pub connection_num: usize,
}

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct MessageId(u64);

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct RequestId {
    connection_id: ConnectionId,
    request_num: usize,
}

pub struct Event {
    pub connection_id: ConnectionId,
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
        message: Vec<u8>,
        deadline: Instant,
    },
}


pub struct ConnectionHandler {
    connection_id: ConnectionId,

    connection: Connection,

    ctrl_chan: UnboundedReceiver<Command>,
    ctrl_handle: UnboundedSender<Command>,

    requests: HashMap<MessageId, usize>,
    timeouts: TimeoutHeap<MessageId>,
    message_counter: u64,
    
    event_channel: UnboundedSender<Event>,
}

impl ConnectionHandler {
    pub fn new(connection_id: ConnectionId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               event_channel: UnboundedSender<Event>)
               -> Self
    {
        let (snd, rcv) = unbounded();

        return ConnectionHandler {
            connection_id,

            connection: Connection::new(token, routing_table),

            ctrl_chan: rcv,
            ctrl_handle: snd,

            requests: HashMap::new(),
            timeouts: TimeoutHeap::new(),
            message_counter: 0,

            event_channel,
        };
    }

    /// Get a handle to the control channel for this client.
    pub fn handle(&self) -> UnboundedSender<Command> {
        self.ctrl_handle.clone()
    }

    /// Send a message to the game this controller serves.
    fn dispatch_event(&mut self, content: EventContent) {
        let event = Event {
            connection_id: self.connection_id,
            content,
        };
        self.event_channel.unbounded_send(event)
            .expect("event channel broke");
    }

    fn poll_ctrl_chan(&mut self) -> Poll<Command, ()> {
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
                    self.send_message(data);
                },
                Command::Request { request_num, message, deadline } => {
                    let message_id = self.send_message(message);
                    self.requests.insert(message_id, request_num);
                    self.timeouts.set_timeout(message_id, deadline);
                },
            }
        }
    }

    fn poll_client_connection(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.connection.poll()) {
                ConnectionEvent::Packet(data) => {
                    self.handle_client_message(data);
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
 
    fn handle_client_message(&mut self, data: Vec<u8>) {
        let message = match proto::Message::decode(data) {
            Err(_err) => unimplemented!(),
            Ok(message) => message,
        };

        match message.payload.unwrap() {
            message::Payload::Message(message) => {
                let message_id = MessageId(message.message_id);
                let data = message.data;
                let event = EventContent::Message { message_id, data };
                self.dispatch_event(event);
            },
            message::Payload::Response(response) => {
                let message_id = MessageId(response.message_id);
                self.resolve_response(message_id, response.data);
            }
        }
    }

    fn resolve_response(&mut self, message_id: MessageId, data: Vec<u8>) {
        if let Some(request_num) = self.requests.remove(&message_id) {
            self.timeouts.cancel_timeout(message_id);
            let value = Ok(data);
            let connection_id = self.connection_id;
            let request_id = RequestId { connection_id, request_num };
            let event = EventContent::Response { request_id, value };
            self.dispatch_event(event);
        }
    }

    fn send_message(&mut self, data: Vec<u8>) -> MessageId {
        let message_id = self.message_counter;
        self.message_counter += 1;

        let message = message::Message { message_id, data };
        self.send_payload(message::Payload::Message(message));
        return MessageId(message_id);
    }

    fn send_reponse(&mut self, message_id: u64, data: Vec<u8>) {
        let response = message::Response { message_id, data };
        self.send_payload(message::Payload::Response(response));
    }

    fn send_payload(&mut self, payload: message::Payload) {
        let message = proto::Message {
            payload: Some(payload),
        };

        let mut bytes = BytesMut::with_capacity(message.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        message.encode(&mut bytes).unwrap();
        self.connection.send(bytes.to_vec());
    }
}

impl Future for ConnectionHandler {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match try!(self.handle_commands()) {
            // ignore the client for now, close the connection when we are done
            Async::Ready(()) => return Ok(Async::Ready(())),
            Async::NotReady => (),
        };
        return self.poll_client_connection();
    }
}