use futures::{Future, Poll, Async};
use std::cmp::{Ord, Ordering, PartialOrd};
use std::collections::{HashMap, BinaryHeap};
use std::time::Instant;

use prost::Message as ProtobufMessage;
use bytes::BytesMut;
use players::{PlayerId, PlayerHandler, PlayerEvent, EventContent};
use tokio::timer::Delay;
use protocol::{self as proto, message};


#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct MessageId(u64);

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

// TODO: name me 
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

pub type ResponseValue = Result<Vec<u8>, ()>;


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

    /// Send a message to a player
    pub fn send(&mut self, player_id: PlayerId, data: Vec<u8>) -> MessageId {
        let message_id = self.get_message_id();

        // TODO: provide an util for this
        let message = proto::Message {
            payload: Some(message::Payload::Message(message::Message {
                message_id: message_id.as_u64(),
                data,
            }))
        };

        let mut bytes = BytesMut::with_capacity(message.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        message.encode(&mut bytes).unwrap();
        self.player_handler.send(player_id, bytes.to_vec());

        return message_id;
    }

    /// Request something from the specified player
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

    pub fn poll_message(&mut self) -> Poll<PlayerMessage, ()> {
        match try!(self.poll_events()) {
            Async::Ready(message) => return Ok(Async::Ready(message)),
            Async::NotReady => {}
        };

        return self.poll_timeout();
    }


    /// Adds a deadline to the deadline queue, updating the delay future if
    /// neccesary.
    fn enqueue_deadline(&mut self, message_id: MessageId, instant: Instant) {
        if instant < self.delay.deadline() {
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

    fn get_message_content(&mut self, player_id: PlayerId, data: Vec<u8>)
        -> Result<MessageContent, ()>
    {
        let message = match proto::Message::decode(data) {
            Err(err) => panic!("got invalid message: {:?}", err),
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

    fn resolve_response(&mut self, player_id: PlayerId, message_id: MessageId)
        -> Result<(), ()>
    {
        // TODO: replace panics with error values, so that they can be logged
        // and handled gracefully

        // If the request id is not in the hashmap of unresolved requests,
        // someone sent a rogue response.
        let request_player = match self.requests.get(&message_id) {
            // TODO: panic is for debugging reasons,
            //       remove me when everything works
            // TODO: it should be logged though
            None => panic!("got unsolicited response"),
            Some(&player_id) => player_id,
        };
        
        // Check whether the sender is authorized to answer this request.
        if player_id != request_player {
            panic!("got a rogue answer");
        }

        // mark the request as resolved
        self.requests.remove(&message_id);
        return Ok(());
    }

    fn poll_timeout(&mut self) -> Poll<PlayerMessage, ()> {
        loop {
            try_ready!(self.poll_delay());
            // delay has passed, so the soonest deadline has expired
            let message_id = match self.deadlines.pop() {
                None => return Ok(Async::NotReady),
                Some(deadline) => deadline.message_id,
            };

            // set delay for next deadline
            if let Some(next_deadline) = self.deadlines.peek() {
                self.delay.reset(next_deadline.instant);
            }

            if let Some(player_id) = self.requests.remove(&message_id) {
                let value = Err(());
                let content = MessageContent::Response { message_id, value };
                let message = PlayerMessage { player_id, content };
                return Ok(Async::Ready(message));
            }
        }
    }

    /// Poll timer and expire requests if neccesary.
    fn poll_delay(&mut self) -> Poll<(), ()> {
        match self.delay.poll() {
            Ok(res) => return Ok(res),
            Err(err) => panic!("timer error: {:?}", err),
        }
    }

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
        self.instant.cmp(&other.instant)
    }
}

impl PartialOrd for Deadline {
    fn partial_cmp(&self, other: &Deadline) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
