use futures::{Future, Poll, Async};
use std::cmp::{Ord, Ordering, PartialOrd};
use std::collections::{HashMap, BinaryHeap};
use std::time::Instant;

use prost::Message as ProtobufMessage;
use bytes::BytesMut;
use players::{PlayerId, PlayerHandler, PlayerEvent, EventContent};
use tokio::timer::Delay;
use protocol::{self as proto, message};


/// Uniquely identifies a message sent by this handler
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct MessageId(u64);

/// Uniquely identifies a message sent by a player
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ForeignMessageId {
    player_id: PlayerId,
    message_id: u64,
}

impl MessageId {
    fn as_u64(&self) -> u64 {
        let MessageId(num) = *self;
        return num;
    }
}

pub struct PlayerMessage {
    pub player_id: PlayerId,
    pub content: MessageContent,
}

pub enum MessageContent {
    Message {
        message_id: ForeignMessageId,
        data: Vec<u8>,
    },
    Response {
        message_id: MessageId,
        // TODO: this might not be the nicest name
        value: ResponseValue,
    },
    // TODO: disconnect, ...
}

/// The result of a response
pub type ResponseValue = Result<Vec<u8>, ResponseError>;

pub enum ResponseError {
    /// Indicates that a response did not arrive in time
    Timeout,
}


// TODO: is this decently named?
/// A MessageResolver implements a simple communication scheme that allows
/// sending messages to peers, with the added ability to wait for a response.
/// The communication scheme is designed to be liberal, not making too many
/// assumptions about the usage pattern. When receiving a message, the user
/// can decide for himself whether this message requires a response or not.
/// This way, the scheme can be used both for request/response (RPC style)
/// interaction, one-way messages, or any combination of both.
///
/// The communication scheme works by assigning each message an unique number,
/// which then optionally serves as a synchronization point. The synchronization
/// can then be performed by sending a response tagged with the same
/// identification number.
pub struct MessageResolver {
    /// The PlayerHandler this message resolver acts upon.
    player_handler: PlayerHandler,

    /// Maps unresolved requests to the player that has to answer them.
    requests: HashMap<MessageId, PlayerId>,

    /// A queue containing the timeouts for the currently running requests.
    deadlines: BinaryHeap<Deadline>,

    /// For generating message identifiers.
    message_counter: u64,

    /// A Delay future that will be ready on the soonest deadline.
    delay: Delay,
}

impl MessageResolver {

    /// Construct a lock for given player handles and message channel.
    pub fn new(player_handler: PlayerHandler) -> Self {
        MessageResolver {
            player_handler,
            requests: HashMap::new(),
            deadlines: BinaryHeap::new(),
            message_counter: 0,
            delay: Delay::new(Instant::now()),
        }
    }

    /// Send a message to a player.
    pub fn send(&mut self, player_id: PlayerId, data: Vec<u8>) -> MessageId {
        let message_id = self.get_message_id();

        let message = message::Message {
            message_id: message_id.as_u64(),
            data,
        };

        let payload = message::Payload::Message(message);
        self.send_message(player_id, payload);
        
        return message_id;
    }

    /// Send a message to a player and wait until deadline for a response.
    pub fn request(&mut self,
                   player_id: PlayerId,
                   data: Vec<u8>,
                   deadline: Instant)
                   -> MessageId
    {
        let message_id = self.send(player_id, data);
        self.requests.insert(message_id, player_id);
        self.enqueue_deadline(message_id, deadline);
        return message_id;
    }

    /// Poll the resolver for a message.
    pub fn poll_message(&mut self) -> Poll<PlayerMessage, ()> {
        match try!(self.poll_events()) {
            Async::Ready(message) => return Ok(Async::Ready(message)),
            Async::NotReady => {}
        };
        return self.poll_timeout();
    }

    /// Send a response to a message previously received from a player.
    pub fn respond(&mut self, foreign_id: ForeignMessageId, data: Vec<u8>) {
        let ForeignMessageId { player_id, message_id } = foreign_id;
        let response = message::Response {
            message_id: message_id,
            data,
        };
        let payload = message::Payload::Response(response);
        self.send_message(player_id, payload);        
    }

    /// Dispatch a payload to a player.
    fn send_message(&mut self, player_id: PlayerId, payload: message::Payload) {
        let message = proto::Message {
            payload: Some(payload),
        };

        let mut bytes = BytesMut::with_capacity(message.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        message.encode(&mut bytes).unwrap();
        self.player_handler.send(player_id, bytes.to_vec());
    }


    /// Adds a deadline to the deadline queue, updating the delay future if
    /// neccesary.
    fn enqueue_deadline(&mut self, message_id: MessageId, instant: Instant) {
        if instant < self.delay.deadline() || self.deadlines.is_empty() {
            self.delay.reset(instant);
        }
        let deadline = Deadline { message_id, instant };
        self.deadlines.push(deadline);
    }

    /// Receive messages from the connected clients.
    fn poll_events(&mut self) -> Poll<PlayerMessage, ()>
    {
        // we have to loop here because responses can be invalid (and are
        // therefore ignored)
        loop {
            let player_event = try_ready!(self.player_handler.poll_message());
            let PlayerEvent { player_id, content } = player_event;
            match content {
                EventContent::Data(data) => {
                    match self.get_message_content(player_id, data) {
                        Ok(content) => {
                            let message = PlayerMessage { player_id, content };
                            return Ok(Async::Ready(message));
                        },
                        Err(_) => {
                            // do nothing
                        }
                    }
                },
                _ => {
                    // TODO
                    unimplemented!()
                },
            };
        }
    }

    // TODO: yield descriptive error values that can be logged, instead of ().
    /// Parse a message.
    fn get_message_content(&mut self, player_id: PlayerId, data: Vec<u8>)
        -> Result<MessageContent, ()>
    {
        let message = match proto::Message::decode(data) {
            Err(_err) => return Err(()),
            Ok(message) => message,
        };
        let content = match message.payload.unwrap() {
            message::Payload::Message(message)=> {
                let message_id = ForeignMessageId {
                    player_id: player_id,
                    message_id: message.message_id,
                };
                let data = message.data;
                MessageContent::Message { message_id, data }
            }
            message::Payload::Response(response) => {
                let message_id = MessageId(response.message_id);
                try!(self.resolve_response(player_id, message_id));
                let value = Ok(response.data);
                MessageContent::Response { message_id, value }
            }
        };
        return Ok(content);
    }

    // TODO: yield descriptive error values that can be logged, instead of ().
    /// Try matching a response with a request, and resolve the request.
    fn resolve_response(&mut self, player_id: PlayerId, message_id: MessageId)
        -> Result<(), ()>
    {
        // If the request id is not in the hashmap of unresolved requests,
        // someone sent a rogue response.
        let request_player = match self.requests.get(&message_id) {
            None => return Err(()),
            Some(&player_id) => player_id,
        };
        
        // Check whether the sender is authorized to answer this request.
        if player_id != request_player {
            return Err(());
        }

        // mark the request as resolved
        self.requests.remove(&message_id);
        return Ok(());
    }

    /// Poll for a timeout message.
    fn poll_timeout(&mut self) -> Poll<PlayerMessage, ()> {
        loop {
            let deadline = try_ready!(self.poll_deadline());
            let message_id = deadline.message_id;

            // set delay for next deadline
            if let Some(next_deadline) = self.deadlines.peek() {
                self.delay.reset(next_deadline.instant);
            }

            if let Some(player_id) = self.requests.remove(&message_id) {
                let value = Err(ResponseError::Timeout);
                let content = MessageContent::Response { message_id, value };
                let message = PlayerMessage { player_id, content };
                return Ok(Async::Ready(message));
            }
        }
    }

    /// Poll for a deadline that has elapsed.
    fn poll_deadline(&mut self) -> Poll<Deadline, ()> {
        // TODO: comment this.

        try_ready!(self.poll_delay());

        // TODO: especially this frankenstein
        {
            let deadline = match self.deadlines.peek() {
                None => return Ok(Async::NotReady),
                Some(deadline) => deadline,
            };

            if Instant::now() <= deadline.instant {
                return Ok(Async::NotReady);
            }
        }

        let deadline = self.deadlines.pop().unwrap();
        return Ok(Async::Ready(deadline));
    }

    /// Poll the deadline timer.
    fn poll_delay(&mut self) -> Poll<(), ()> {        
        match self.delay.poll() {
            Ok(res) => return Ok(res),
            // timer errors are programming errors; they should not happen.
            Err(err) => panic!("timer error: {:?}", err),
        }
    }

    /// Yield a fresh message id.
    fn get_message_id(&mut self) -> MessageId {
        self.message_counter += 1;
        return MessageId(self.message_counter);
    }
}

/// Marks when a request should expire.
#[derive(Clone, Copy, Eq, PartialEq)]
struct Deadline {
    message_id: MessageId,
    instant: Instant,
}

impl Ord for Deadline {
    fn cmp(&self, other: &Deadline) -> Ordering {
        // reverse order so that the maximum deadline expires first.
        other.instant.cmp(&self.instant)
    }
}

impl PartialOrd for Deadline {
    fn partial_cmp(&self, other: &Deadline) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
