use std::collections::HashMap;
use std::mem;
use std::time::{Instant, Duration};

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tokio::timer::Delay;
use connection::connection::{Request, Response};
use client_controller::{ClientMessage, Message, Command};
use super::controller::PlayerId;



pub struct PlayerLock {
    players: HashMap<PlayerId, UnboundedSender<Command>>,
    player_msgs: UnboundedReceiver<ClientMessage>,
    requests: HashMap<PlayerId, RequestData>,
    responses: HashMap<PlayerId, RequestResult>,
    request_counter: usize,
    delay: Delay,
}

struct RequestData {
    player_id: PlayerId,
    request_id: usize,
    deadline: Instant,
}

pub struct Timeout;
pub type RequestResult = Result<Vec<u8>, Timeout>;

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

        self.requests.insert(player_id, RequestData {
            player_id,
            request_id,
            deadline,
        });

        self.set_timeout();

        self.players[&player_id].unbounded_send(Command::Request(Request {
            request_id,
            data,
        })).unwrap();
    }

    fn accept_response(&mut self, player_id: PlayerId, response: Response) {
        let request_data = match self.requests.remove(&player_id) {
            // TODO: panic is for debugging reasons, remove me when everything works
            None => panic!("got unsolicited response"),
            Some(data) => data,
        };
        self.responses.insert(player_id, Ok(response.data));
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

    fn poll_timeout(&mut self) -> Poll<(), ()> {
        match self.delay.poll() {
            Ok(Async::Ready(())) => {},
            Ok(Async::NotReady) => return Ok(Async::NotReady),
            Err(err) => panic!("timer error: {:?}", err),
        };
        // TODO: this is ugly. please fix.
        {
            let now = Instant::now();
            let responses = &mut self.responses;
            let unexpired = self.requests.drain().filter(|&(_, ref request_data)| {
                if request_data.deadline > now {
                    true
                } else {
                    responses.insert(request_data.player_id, Err(Timeout));
                    false
                }
            }).collect();
            self.requests = unexpired;
        }
        self.set_timeout();
        return Ok(Async::Ready(()));
    }

    // TODO: incrementally compute this
    fn set_timeout(&mut self) {
        let first_deadline = self.requests
            .iter()
            .map(|(_, request_data)| request_data.deadline)
            .min();
        if let Some(instant) = first_deadline {
            self.delay.reset(instant);
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

            try_ready!(self.poll_timeout());
        }
    }
}