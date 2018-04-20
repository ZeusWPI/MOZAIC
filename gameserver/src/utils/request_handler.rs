use futures::{Future, Poll, Async};
use std::cmp::{Ord, Ordering, PartialOrd};
use std::collections::{HashMap, BinaryHeap};
use std::time::Instant;

use bytes::BytesMut;
use players::{PlayerId, PlayerHandler, PlayerMessage, MessageContent};
use tokio::timer::Delay;
use prost::Message;
use protocol as proto;


/// A basic util for sending requests to multiple players which have to be
/// answered before a specified deadline. It is limited to one request per
/// player. TODO: what would an ergonomic interface look like that lifts this
/// restriction?
/// All requests are uniquely numbered to avoid that delayed messages end up in
/// the next round of requests.
/// The `request` method can be used to add a request to the lock.
/// The lock will then resolve once all requests are resolved, and yield the
/// results.
pub struct RequestHandler {
    /// The PlayerHandler operated by this lock.
    player_handler: PlayerHandler,

    /// Maps unresolved requests to the player that has to answer them.
    requests: HashMap<u64, PlayerId>,

    /// The results that have already been received.
    results: HashMap<PlayerId, RequestResult>,

    /// A queue containing the timeouts for the currently running requests.
    deadlines: BinaryHeap<Deadline>,

    /// For generating unique request identifiers.
    request_counter: u64,

    /// A Delay future that will be ready on the soonest request deadline.
    delay: Delay,
}

/// Timeout marker type
pub struct Timeout;

pub struct RequestResult {
    request_id: u64,
    result: ResultType,
}

pub enum ResultType {
    Response(Vec<u8>),
    Timeout,
}

/// Marks when a request should expire.
#[derive(Copy, Clone, Eq, PartialEq)]
struct Deadline {
    request_id: u64,
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

impl RequestHandler {

    /// Construct a lock for given player handles and message channel.
    pub fn new(player_handler: PlayerHandler) -> Self {
        RequestHandler {
            player_handler,
            requests: HashMap::new(),
            results: HashMap::new(),
            deadlines: BinaryHeap::new(),
            request_counter: 0,
            delay: Delay::new(Instant::now()),
        }
    }

    /// Send a request to the specified player and add it to the lock.
    pub fn request(&mut self,
                   player_id: PlayerId,
                   data: Vec<u8>,
                   deadline: Instant)
    {
        let request_id = self.request_counter;
        self.request_counter += 1;

        self.enqueue_deadline(request_id, deadline);
        self.requests.insert(request_id, player_id);

        let request = proto::Request {
            request_id: request_id as u64,
            data,
        };
        let mut bytes = BytesMut::with_capacity(request.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        request.encode(&mut bytes).unwrap();

        self.player_handler.send(player_id, bytes.to_vec());
    }

    /// Check whether a response is valid, and if so, resolve its request.
    fn handle_response(&mut self, player_id: PlayerId, data: Vec<u8>)
        -> Option<RequestResult>
    {
        let response = match proto::Response::decode(data) {
            Ok(response) => response,
            Err(_) => {
                // TODO?
                return None;
            }
        };
        // If the request id is not in the hashmap of unresolved requests,
        // someone sent a rogue response.
        let request_player = match self.requests.get(&response.request_id) {
            // TODO: panic is for debugging reasons,
            //       remove me when everything works
            // TODO: it should be logged though
            None => panic!("got unsolicited response"),
            Some(&player_id) => player_id,
        };
        
        // Check whether the sender is authorized to answer this request.
        if player_id != request_player {
            return None;
        }

        // forget the request and return a response
        self.requests.remove(&response.request_id);
        return Some(RequestResult {
            request_id: response.request_id,
            result: ResultType::Response(response.data),
        });
    }

    /// Adds a deadline to the deadline queue, updating the delay future if
    /// neccesary.
    fn enqueue_deadline(&mut self, request_id: u64, instant: Instant) {
        if instant < self.delay.deadline() {
            self.delay.reset(instant);
        }
        let deadline = Deadline { request_id, instant };
        self.deadlines.push(deadline);
    }

    /// Receive messages from the connected clients.
    fn poll_response(&mut self) -> Poll<RequestResult, ()>
    {
        loop {
            let client_message = try_ready!(self.player_handler.poll_message());
            let PlayerMessage { player_id, content } = client_message;
            let data = match content {
                MessageContent::Data(data) => data,
                _ => {
                    // TODO
                    unimplemented!()
                },
            };
            if let Some(result) = self.handle_response(player_id, data) {
                return Ok(Async::Ready(result));
            }
        }
    }

    fn poll_timeout(&mut self) -> Poll<RequestResult, ()> {
        loop {
            try_ready!(self.poll_delay());
            // delay has passed, so the soonest deadline has expired
            let deadline = match self.deadlines.pop() {
                None => return Ok(Async::NotReady),
                Some(deadline) => deadline,
            };
            // set delay for next deadline
            if let Some(next_deadline) = self.deadlines.peek() {
                self.delay.reset(next_deadline.instant);
            }

            if let Some(_) = self.requests.remove(&deadline.request_id) {
                let result = RequestResult {
                    request_id: deadline.request_id,
                    result: ResultType::Timeout,
                };
                return Ok(Async::Ready(result));
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

    pub fn poll(&mut self) -> Poll<RequestResult, ()> {
        // first try resolving requests by handling incoming messages
        match try!(self.poll_response()) {
            Async::Ready(response) => return Ok(Async::Ready(response)),
            Async::NotReady => {},
        };

        return self.poll_timeout();
    }
}