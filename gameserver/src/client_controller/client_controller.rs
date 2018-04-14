use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use std::io;
use std::str;
use std::sync::{Arc, Mutex};

use connection::router::RoutingTable;
use connection::connection::{Connection, Request, Response};
use connection::connection::Message as ConnectionMessage;

use planetwars::controller::PlayerId;

error_chain! {
    errors {
        ConnectionClosed
    }

    foreign_links {
        Io(io::Error);
    }
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

pub struct ClientController {
    player_id: PlayerId,
    
    connection: Connection,

    ctrl_chan: UnboundedReceiver<Command>,
    ctrl_handle: UnboundedSender<Command>,
    
    game_handle: UnboundedSender<ClientMessage>,
}

impl ClientController {
    pub fn new(player_id: PlayerId,
               token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               game_handle: UnboundedSender<ClientMessage>)
               -> Self
    {
        let (snd, rcv) = unbounded();

        let mut controller = ClientController {
            connection: Connection::new(token, routing_table),

            ctrl_chan: rcv,
            ctrl_handle: snd,

            game_handle,
            player_id,
        };
        controller.send_message(Message::Connected);
        return controller;
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
            ConnectionMessage::Request(request) => {
                panic!("unexpected request");
            },
            ConnectionMessage::Response(response) => {
                self.send_message(Message::Response(response));
            },
        };
    }
}

impl Future for ClientController {
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