use std::collections::HashMap;
use std::mem;

use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use connection::connection::{Request, Response};
use client_controller::{ClientMessage, Message, Command};
use super::controller::PlayerId;

pub struct PlayerLock {
    players: HashMap<PlayerId, UnboundedSender<Command>>,
    player_msgs: UnboundedReceiver<ClientMessage>,
    requests: HashMap<PlayerId, RequestData>,
    responses: HashMap<PlayerId, Vec<u8>>,
    request_counter: usize,
}

struct RequestData {
    player_id: PlayerId,
    request_id: usize,
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
            request_counter: 0,
        }
    }

    pub fn request(&mut self, player_id: PlayerId, data: Vec<u8>) {
        let request_id = self.request_counter;
        self.request_counter += 1;

        self.requests.insert(player_id, RequestData {
            player_id,
            request_id,
        });

        self.players[&player_id].unbounded_send(Command::Request(Request {
            request_id,
            data,
        }));
    }

    fn accept_response(&mut self, player_id: PlayerId, response: Response) {
        let request_data = match self.requests.remove(&player_id) {
            // TODO: panic is for debugging reasons, remove me when everything works
            None => panic!("got unsolicited response"),
            Some(data) => data,
        };
        self.responses.insert(player_id, response.data);
    }
}

impl Future for PlayerLock {
    type Item = HashMap<PlayerId, Vec<u8>>;
    type Error = ();

    fn poll(&mut self) -> Poll<Self::Item, ()> {
        let client_message = try_ready!(self.player_msgs.poll());
        let ClientMessage { player_id, message } = client_message.unwrap();
        match message {
            Message::Response(response) => {
                self.accept_response(player_id, response);
            },
            // ignore other cases for now
            _ => ()
        };

        if self.requests.is_empty() {
            // all requests have been answered
            let responses = mem::replace(&mut self.responses, HashMap::new());
            return Ok(Async::Ready(responses));
        } else {
            return Ok(Async::NotReady);
        }
        
    }
}