use futures::{Poll, Async};
use std::collections::HashMap;
use std::mem;
use std::time::Instant;

use players::{PlayerId, PlayerHandler};

use super::message_resolver::{MessageResolver, MessageId, PlayerMessage, MessageContent, ResponseValue};

/// A basic util for sending requests to multiple players which have to be
/// answered before a specified deadline. It is limited to one request per
/// player. 
/// All requests are uniquely numbered to avoid that delayed messages end up in
/// the next round of requests.
/// The `request` method can be used to add a request to the lock.
/// The lock will then resolve once all requests are resolved, and yield the
/// results.
pub struct PlayerLock {
    /// The MessageResolver operated by this lock.
    message_resolver: MessageResolver,

    /// Maps unresolved requests to the player that has to answer them.
    requests: HashMap<MessageId, PlayerId>,

    /// The results that have already been received.
    results: HashMap<PlayerId, ResponseValue>,
}


impl PlayerLock {

    /// Construct a lock for given player handles and message channel.
    pub fn new(player_handler: PlayerHandler) -> Self {
        PlayerLock {
            message_resolver: MessageResolver::new(player_handler),
            requests: HashMap::new(),
            results: HashMap::new(),
        }
    }

    /// Send a request to the specified player and add it to the lock.
    pub fn request(&mut self,
                   player_id: PlayerId,
                   data: Vec<u8>,
                   deadline: Instant)
    {
        let request_id = self.message_resolver.request(
            player_id,
            data,
            deadline
        );
        self.requests.insert(request_id, player_id);
    }

    pub fn poll(&mut self) -> Poll<HashMap<PlayerId, Result<Vec<u8>, ()>>, ()> {

        // receive messages while there are unanswered requests
        while !self.requests.is_empty() {
            let message = try_ready!(self.message_resolver.poll_message());
            self.handle_message(message);
        }
        let results = mem::replace(&mut self.results, HashMap::new());
        return Ok(Async::Ready(results));
    }

    fn handle_message(&mut self, message: PlayerMessage) {
        match message.content {
            MessageContent::Message { .. } => {
                // ignore
                // TODO: log
            },
            MessageContent::Response { message_id, value } => {
                let player_id = self.requests.remove(&message_id).unwrap();
                self.results.insert(player_id, value);
            }
        }
    }
}