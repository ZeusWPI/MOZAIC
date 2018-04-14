use std::collections::{HashMap, BinaryHeap};
use std::mem;
use std::time::Instant;
use std::cmp::{Ord, Ordering, PartialOrd};

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tokio::timer::Delay;
use connection::connection::{Request, Response};
use client_controller::{ClientMessage, Message, Command};
use super::controller::PlayerId;


/// A basic util for sending requests to multiple players which have to be
/// answered before a specified deadline. It is limited to one request per
/// player. TODO: what would an ergonomic interface look like that lifts this
/// restriction?
/// All requests are uniquely numbered to avoid that delayed messages end up in
/// the next round of requests.
/// The `request` method can be used to add a request to the lock.
/// The lock will then resolve once all requests are resolved, and yield the
/// results.
pub struct PlayerLock {

    /// Message channels to all connected players.
    players: HashMap<PlayerId, UnboundedSender<Command>>,

    /// A message channel that carries player responses.
    player_msgs: UnboundedReceiver<ClientMessage>,

    /// Maps unresolved requests to the player that has to answer them.
    requests: HashMap<usize, PlayerId>,

    /// The results that have already been received.
    results: HashMap<PlayerId, RequestResult>,

    /// A queue containing the timeouts for the currently running requests.
    deadlines: BinaryHeap<Deadline>,

    /// For generating unique request identifiers.
    request_counter: usize,

    /// A Delay future that will be ready on the soonest request deadline.
    delay: Delay,
}

/// Timeout marker type
pub struct Timeout;
pub type RequestResult = Result<Vec<u8>, Timeout>;

/// Marks when a request should expire.
#[derive(Copy, Clone, Eq, PartialEq)]
struct Deadline {
    request_id: usize,
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

impl PlayerLock {

    /// Construct a lock for given player handles and message channel.
    pub fn new(
            players: HashMap<PlayerId, UnboundedSender<Command>>,
            player_msgs: UnboundedReceiver<ClientMessage>
        ) -> Self
    {
        PlayerLock {
            players,
            player_msgs,
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
        self.players[&player_id].unbounded_send(Command::Request(Request {
            request_id,
            data,
        })).unwrap();
    }

    /// Check whether a response is valid, and if so, resolve its request.
    fn accept_response(&mut self, player_id: PlayerId, response: Response) {
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
        if player_id == request_player {
            self.requests.remove(&response.request_id);
            self.results.insert(player_id, Ok(response.data));
        }
    }

    /// Adds a deadline to the deadline queue, updating the delay future if
    /// neccesary.
    fn enqueue_deadline(&mut self, request_id: usize, instant: Instant) {
        if instant < self.delay.deadline() {
            self.delay.reset(instant);
        }
        let deadline = Deadline { request_id, instant };
        self.deadlines.push(deadline);
    }

    /// Receive messages from the connected clients.
    fn poll_messages(&mut self) -> Poll<HashMap<PlayerId, RequestResult>, ()>
    {
        // receive messages while there are unanswered requests
        while !self.requests.is_empty() {
            let client_message = try_ready!(self.player_msgs.poll());
            let ClientMessage { player_id, message } = client_message.unwrap();
            match message {
                Message::Response(response) => {
                    self.accept_response(player_id, response);
                },
                // ignore other cases for now
                _ => ()
            };
        }
        let responses = mem::replace(&mut self.results, HashMap::new());
        return Ok(Async::Ready(responses));
    }

    /// Timeout all requests whose deadlines have passed.
    fn timeout_requests(&mut self) {
        let now = Instant::now();
        while !self.deadlines.is_empty() {
            let &deadline = self.deadlines.peek().unwrap();
            let Deadline { request_id, instant } = deadline;

            if instant > now {
                // This deadline has not passed yet; set a timer for it.
                self.delay.reset(instant);
                return;
            } else {
                // This deadline has passed, time-out its request ...
                if let Some(player_id) = self.requests.remove(&request_id) {
                    self.results.insert(player_id, Err(Timeout));
                }
                // ... and remove it from the queue.
                self.deadlines.pop();
            }
        }  
    }

    /// Poll timer and expire requests if neccesary.
    fn poll_delay(&mut self) -> Poll<(), ()> {
        match self.delay.poll() {
            Ok(Async::Ready(())) => {
                self.timeout_requests();
                return Ok(Async::Ready(()));
            },
            Ok(Async::NotReady) => Ok(Async::NotReady),
            Err(err) => panic!("timer error: {:?}", err),
        }
    }
}

impl Future for PlayerLock {
    type Item = HashMap<PlayerId, RequestResult>;
    type Error = ();

    fn poll(&mut self) -> Poll<Self::Item, ()> {
        loop {
            // first try resolving requests by handling incoming messages
            match try!(self.poll_messages()) {
                Async::Ready(responses) => return Ok(Async::Ready(responses)),
                Async::NotReady => {},
            };

            // then check for time-outs.
            try_ready!(self.poll_delay());
        }
    }
}