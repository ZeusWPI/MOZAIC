use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use tokio::net::TcpStream;
use bytes::BytesMut;
use std::io;
use std::str;
use slog;

use protobuf_codec::ProtobufTransport;
use router::{RouterCommand, RegisterRequest, UnregisterRequest};
use super::client_connection::ClientConnection;



error_chain! {
    errors {
        ConnectionClosed
    }

    foreign_links {
        Io(io::Error);
    }
}

pub struct ClientMessage {
    pub client_id: usize,
    pub message: Message,
}

pub enum Message {
    Data(Vec<u8>),
    Disconnected,
}

pub enum Command {
    Send(Vec<u8>),
    Connect(Transport),
}

// TODO: maybe use a type parameter instead of hardcoding
type Transport = ProtobufTransport<TcpStream>;


pub struct ClientController {
    token: Vec<u8>,
    client_id: usize,
    
    connection: ClientConnection<Transport>,

    ctrl_chan: UnboundedReceiver<Command>,
    ctrl_handle: UnboundedSender<Command>,
    
    game_handle: UnboundedSender<ClientMessage>,
    router_handle: UnboundedSender<RouterCommand>,

    logger: slog::Logger,
}

impl ClientController {
    pub fn new(client_id: usize,
               token: Vec<u8>,
               router_handle: UnboundedSender<RouterCommand>,
               game_handle: UnboundedSender<ClientMessage>,
               logger: &slog::Logger)
               -> Self
    {
        let (snd, rcv) = unbounded();

        ClientController {
            connection: ClientConnection::new(),
            token,

            ctrl_chan: rcv,
            ctrl_handle: snd,

            game_handle,
            router_handle,
            client_id,

            logger: logger.new(
                o!("client_id" => client_id)
            ),
        }
    }

    /// Register this ClientController with its router
    pub fn register(&mut self) {
        let request = RegisterRequest {
            token: self.token.clone(),
            handle: self.handle(),
        };
        self.router_handle.unbounded_send(RouterCommand::Register(request))
            .expect("router handle closed");
    }

    /// Unregister this ClientController from its router
    pub fn unregister(&mut self) {
        let request = UnregisterRequest {
            token: self.token.clone(),
        };
        self.router_handle.unbounded_send(RouterCommand::Unregister(request))
            .expect("router handle closed");
    }

    /// Get a handle to the control channel for this client.
    pub fn handle(&self) -> UnboundedSender<Command> {
        self.ctrl_handle.clone()
    }

    /// Send a message to the game this controller serves.
    fn send_message(&mut self, message: Message) {
        let msg = ClientMessage {
            client_id: self.client_id,
            message: message,
        };
        self.game_handle.unbounded_send(msg).expect("game handle broke");
    }


    fn poll_ctrl_chan(&mut self) -> Async<Command> {
        // we hold a handle to this channel, so it can never close.
        // this means errors can not happen.
        let value = self.ctrl_chan.poll().unwrap();
        return value.map(|item| item.unwrap());
    }

    /// Pull commands from the control channel and execute them.
    fn handle_commands(&mut self) {
        while let Async::Ready(command) = self.poll_ctrl_chan() {
            match command {
                Command::Send(message) => {
                    let bytes = BytesMut::from(message);
                    self.connection.queue_send(bytes);
                },
                Command::Connect(transport) => {
                    self.connection.set_transport(transport);
                },
            }
        }
    }

    fn poll_client_connection(&mut self) -> Poll<(), io::Error> {
        try!(self.connection.flush());
        loop {
            let bytes = try_ready!(self.connection.poll());
            self.handle_client_message(bytes.freeze().to_vec());
        }
    }
 

    fn handle_client_message(&mut self, bytes: Vec<u8>) {
        let data = Message::Data(bytes);
        self.send_message(data);
    }
}

impl Future for ClientController {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let res = self.poll_client_connection();
        if let Err(_err) = res {
            // TODO: log
            self.connection.drop_transport();
        }
        
        self.handle_commands();
        // TODO: proper exit
        Ok(Async::NotReady)
    }
}