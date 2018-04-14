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



pub struct PlayerLock {
    players: HashMap<PlayerId, UnboundedSender<Command>>,
    player_msgs: UnboundedReceiver<ClientMessage>,
    requests: HashMap<usize, PlayerId>,
    responses: HashMap<PlayerId, RequestResult>,
    deadlines: BinaryHeap<Deadline>,
    request_counter: usize,
    delay: Delay,
}

pub struct Timeout;
pub type RequestResult = Result<Vec<u8>, Timeout>;

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
    pub fn new(
            players: HashMap<PlayerId, UnboundedSender<Command>>,
            player_msgs: UnboundedReceiver<ClientMessage>
        ) -> Self
    {
        PlayerLock {
            players,
            player_msgs,
            requests: HashMap::new(),
            responses: HashMap::new(),
            deadlines: BinaryHeap::new(),
            request_counter: 0,
            delay: Delay::new(Instant::now()),
        }
    }

    pub fn request(
        &mut self,
        player_id: PlayerId,
        data: Vec<u8>,
        deadline: Instant
    ) {
        let request_id = self.request_counter;
        self.request_counter += 1;

        self.enqueue_deadline(request_id, deadline);
        self.requests.insert(request_id, player_id);
        self.players[&player_id].unbounded_send(Command::Request(Request {
            request_id,
            data,
        })).unwrap();
    }

    fn accept_response(&mut self, player_id: PlayerId, response: Response) {
        let request_data = match self.requests.remove(&response.request_id) {
            // TODO: panic is for debugging reasons, remove me when everything works
            None => panic!("got unsolicited response"),
            Some(data) => data,
        };
        self.responses.insert(player_id, Ok(response.data));
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

    fn poll_responses(&mut self) -> Poll<HashMap<PlayerId, RequestResult>, ()>
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
        let responses = mem::replace(&mut self.responses, HashMap::new());
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
                    self.responses.insert(player_id, Err(Timeout));
                }
                // ... and remove it from the queue.
                self.deadlines.pop();
            }
        }  
    }

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
            match try!(self.poll_responses()) {
                Async::Ready(responses) => return Ok(Async::Ready(responses)),
                Async::NotReady => {},
            };

            try_ready!(self.poll_delay());
        }
    }
}