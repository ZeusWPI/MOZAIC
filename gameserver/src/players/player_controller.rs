use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::io;
use std::str;
use std::sync::{Arc, Mutex};
use slog;

use network::router::RoutingTable;
use network::connection::Connection;

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
    pub handle: UnboundedSender<PlayerCommand>,
}

pub struct PlayerEvent {
    pub player_id: PlayerId,
    pub content: EventContent,
}

pub enum EventContent {
    Data(Vec<u8>),
    Disconnected,
}

pub enum PlayerCommand {
    Send(Vec<u8>),
    Disconnect,
}

/// The PlayerController is in charge of handling a player connection.
/// It bridges between the game controller and the network connection
/// to the actual client.
pub struct PlayerController {
    player_id: PlayerId,
    
    connection: Connection,

    ctrl_chan: UnboundedReceiver<PlayerCommand>,
    ctrl_handle: UnboundedSender<PlayerCommand>,
    
    game_handle: UnboundedSender<PlayerEvent>,
}

impl PlayerController {
    pub fn new(player_id: PlayerId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               game_handle: UnboundedSender<PlayerEvent>)
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
    pub fn handle(&self) -> UnboundedSender<PlayerCommand> {
        self.ctrl_handle.clone()
    }

    /// Send a message to the game this controller serves.
    fn send_message(&mut self, content: EventContent) {
        let msg = PlayerEvent {
            player_id: self.player_id,
            content,
        };
        self.game_handle.unbounded_send(msg).expect("game handle broke");
    }

    fn poll_ctrl_chan(&mut self) -> Poll<PlayerCommand, ()> {
        // we hold a handle to this channel, so it can never close.
        // this means errors can not happen.
        let value = self.ctrl_chan.poll().unwrap();
        return Ok(value.map(|item| item.unwrap()));
    }

    /// Pull commands from the control channel and execute them.
    fn handle_commands(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.poll_ctrl_chan()) {
                PlayerCommand::Send(data) => {
                   self.connection.send(data);
                },
                PlayerCommand::Disconnect => {
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
 
    fn handle_client_message(&mut self, msg: Vec<u8>) {
        self.send_message(EventContent::Data(msg));
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