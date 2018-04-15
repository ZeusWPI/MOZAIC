use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::io;
use std::str;
use std::sync::{Arc, Mutex};
use slog;

use connection::router::RoutingTable;
use connection::connection::{Connection, Request, Response};
use connection::connection::Message as ConnectionMessage;

// TODO: find a better place for this
#[derive(PartialEq, Clone, Copy, Eq, Hash, Serialize, Deserialize, Debug)]
pub struct PlayerId {
    id: usize,
}

impl PlayerId {
    pub fn new(id: usize) -> PlayerId {
        PlayerId {
            id
        }
    }

    pub fn as_usize(&self) -> usize {
        self.id
    }
}

impl slog::KV for PlayerId {
    fn serialize(&self,
                 _record: &slog::Record,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_usize("player_id", self.as_usize())
    }
}


// TODO: find a better place for this
#[derive(Clone)]
pub struct Client {
    pub id: PlayerId,
    pub player_name: String,
    pub handle: UnboundedSender<Command>,
}

pub struct ClientMessage {
    pub player_id: PlayerId,
    pub message: Message,
}

pub enum Message {
    Response(Response),
    Connected,
    Disconnected,
    Timeout,
}

pub enum Command {
    Request(Request),
    Disconnect,
}

/// The PlayerController is in charge of handling a player connection.
/// It bridges between the game controller and the network connection
/// to the actual client.
pub struct PlayerController {
    player_id: PlayerId,
    
    connection: Connection,

    ctrl_chan: UnboundedReceiver<Command>,
    ctrl_handle: UnboundedSender<Command>,
    
    game_handle: UnboundedSender<ClientMessage>,
}

impl PlayerController {
    pub fn new(player_id: PlayerId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               game_handle: UnboundedSender<ClientMessage>)
               -> Self
    {
        let (snd, rcv) = unbounded();

        return PlayerController {
            connection: Connection::new(token, routing_table),

            ctrl_chan: rcv,
            ctrl_handle: snd,

            game_handle,
            player_id,
        };
    }

    /// Get a handle to the control channel for this client.
    pub fn handle(&self) -> UnboundedSender<Command> {
        self.ctrl_handle.clone()
    }

    /// Send a message to the game this controller serves.
    fn send_message(&mut self, message: Message) {
        let msg = ClientMessage {
            player_id: self.player_id,
            message: message,
        };
        self.game_handle.unbounded_send(msg).expect("game handle broke");
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
                Command::Request(request) => {
                   self.connection.send(ConnectionMessage::Request(request))
                },
                Command::Disconnect => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn poll_client_connection(&mut self) -> Poll<(), io::Error> {
        try!(self.connection.flush_buffer());
        loop {
            let item = try_ready!(self.connection.poll_message());
            if let Some(msg) = item {
                self.handle_client_message(msg);
            }
        }
    }
 
    // TODO: this naming sucks because ClientMessage is also an enum
    // that does the exact opposite
    fn handle_client_message(&mut self, msg: ConnectionMessage) {
        match msg {
            ConnectionMessage::Request(_request) => {
                panic!("unexpected request");
            },
            ConnectionMessage::Response(response) => {
                self.send_message(Message::Response(response));
            },
        };
    }
}

impl Future for PlayerController {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match try!(self.handle_commands()) {
            // ignore the client for now, close the connection when we are done
            Async::Ready(()) => return Ok(Async::Ready(())),
            Async::NotReady => (),
        };
        let res = self.poll_client_connection();
        if let Err(_err) = res {
            // TODO: well
        }
        
        // TODO: proper exit
        Ok(Async::NotReady)
    }
}