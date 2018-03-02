use futures::{Future, Poll, Async};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use futures::stream::{Stream, SplitStream, SplitSink};
use tokio_io::AsyncRead;
use tokio::net::TcpStream;
use tokio_io::codec::Framed;
use tokio_io::codec::{Encoder, Decoder};
use bytes::{BytesMut, BufMut};
use std::io;
use std::str;
use slog;

use super::client_connection::ClientConnection;
use bot_runner::BotHandle;


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
    Data(String),
    Disconnected,
}

pub enum Command {
    Send(String),
    Connect(TcpStream),
}

// TODO: the client controller should also be handed a log handle


pub struct ClientController {
    client_id: usize,
    
    connection: ClientConnection<Transport>,

    ctrl_chan: UnboundedReceiver<Command>,
    ctrl_handle: UnboundedSender<Command>,
    
    game_handle: UnboundedSender<ClientMessage>,

    logger: slog::Logger,
}

impl ClientController {
    pub fn new(client_id: usize,
               transport: Transport,
               game_handle: UnboundedSender<ClientMessage>,
               logger: &slog::Logger)
               -> Self
    {
        let (snd, rcv) = unbounded();

        let mut connection = ClientConnection::new();
        connection.set_transport(transport);

        ClientController {
            connection: connection,

            ctrl_chan: rcv,
            ctrl_handle: snd,

            game_handle,
            client_id,

            logger: logger.new(
                o!("client_id" => client_id)
            ),
        }
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

    /// Pull messages from the client, and handle them.
    fn handle_client_msgs(&mut self) -> Result<()> {
        while let Some(line) = try!(self.connection.poll()) {
            
        }
        return Ok(());
    }

    /// The unit error type of ctrl_chan.poll() means that it won't error. Since
    /// we can't cast "won't error" to our custom error type, we cannot use the
    /// try_ready! macro for polling the ctrl_chan. This method provides an
    /// adapter to Poll with our error type.
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
                Command::Send(message) => self.connection.queue_send(message),
                Command::Connect(sock) => unimplemented!(),
            }
        }
    }

    fn poll_client_connection(&mut self) -> Result<()> {
        try!(self.connection.flush());
        while let Some(msg) = try!(self.connection.poll()) {
            self.handle_client_message(msg);
        }
        return Ok(());
    }

    fn handle_client_message(&mut self, msg: String) {
        let data = Message::Data(msg);
        self.send_message(data);
    }

    /// Step the future, allowing errors to be thrown.
    /// These errors then get handled in the actual poll implementation.
    fn try_poll(&mut self) -> Poll<(), Error> {
        let res = self.poll_client_connection();
        if let Err(err) = res {
            self.connection.drop_transport();
            // TODO: log
        }
        self.handle_commands();

        Ok(Async::NotReady)
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



// This is rather temporary.
type Transport = Framed<BotHandle, LineCodec>;

pub struct LineCodec;

impl Encoder for LineCodec {
    type Item = String;
    type Error = io::Error;

    fn encode(&mut self, msg: String, buf: &mut BytesMut) -> io::Result<()> {
        buf.reserve(msg.len() + 1);
        buf.extend(msg.as_bytes());
        buf.put_u8(b'\n');
        Ok(())
    }
}

impl Decoder for LineCodec {
    type Item = String;
    type Error = io::Error;

    fn decode(&mut self, buf: &mut BytesMut) -> io::Result<Option<String>> {
        // Check to see if the frame contains a new line
        if let Some(n) = buf.as_ref().iter().position(|b| *b == b'\n') {
            // remove line from buffer
            let line = buf.split_to(n);

            // remove newline
            buf.split_to(1);

            // Try to decode the line as UTF-8
            return match str::from_utf8(&line.as_ref()) {
                Ok(s) => Ok(Some(s.to_string())),
                Err(_) => Err(io::Error::new(
                    io::ErrorKind::Other, "invalid string")
                ),
            }
        }

        Ok(None)
    }
}
