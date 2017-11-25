use futures::{Future, Poll, Async};
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use futures::stream::{Stream, SplitStream, SplitSink};
use tokio_io::AsyncRead;
use tokio_io::codec::Framed;
use tokio_io::codec::{Encoder, Decoder};
use bytes::{BytesMut, BufMut};
use std::io;
use std::str;

use bot_runner::BotHandle;
use buffered_sender::BufferedSender;


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



pub struct ClientController {
    client_id: usize,
    
    sender: BufferedSender<SplitSink<Transport>>,
    client_msgs: SplitStream<Transport>,

    ctrl_chan: UnboundedReceiver<String>,
    ctrl_handle: UnboundedSender<String>,
    
    game_handle: UnboundedSender<ClientMessage>,
}

impl ClientController {
    pub fn new(client_id: usize,
               conn: BotHandle,
               game_handle: UnboundedSender<ClientMessage>)
               -> Self
    {
        let (snd, rcv) = unbounded();
        let (sink, stream) = conn.framed(LineCodec).split();

        ClientController {
            client_id: client_id,

            sender: BufferedSender::new(sink),
            client_msgs: stream,

            ctrl_chan: rcv,
            ctrl_handle: snd,

            game_handle: game_handle,
        }
    }

    /// Get a handle to the control channel for this client.
    pub fn handle(&self) -> UnboundedSender<String> {
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
    fn handle_client_msgs(&mut self) -> Poll<(), Error> {
        while let Some(line) = try_ready!(self.client_msgs.poll()) {
            let msg = Message::Data(line);
            self.send_message(msg);
        }
        bail!(ErrorKind::ConnectionClosed)
    }

    /// Pull commands from the control channel, and handle them.
    fn handle_commands(&mut self) -> Poll<(), ()> {
        while let Some(command) = try_ready!(self.ctrl_chan.poll()) {
            self.sender.send(command);
        }
        Ok(Async::Ready(()))
    }

    /// Try sending messages to the client, in an asynchronous fashion.
    fn write_messages(&mut self) -> Poll<(), io::Error> {
        self.sender.poll()
    }

    /// Step the future, allowing errors to be thrown.
    /// These errors then get handled in the actual poll implementation.
    fn try_poll(&mut self) -> Poll<(), Error> {
        // we own this channel, it should not fail or terminate.
        self.handle_commands().unwrap();
        try!(self.handle_client_msgs());
        try!(self.write_messages());
        // TODO: returning NotReady unconditionally here might be a little
        // dodgy.
        Ok(Async::NotReady)
    }
}

impl Future for ClientController {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        // TODO: errors should be handled
        Ok(match self.try_poll() {
            // Returning ready terminates the task. We only want to do that when
            // an error happens.
            // TODO: how do we handle graceful disconnects?
            Ok(Async::Ready(())) => panic!("something bad happened"),
            Ok(Async::NotReady) => Async::NotReady,
            Err(_err) => {
                // TODO: are some errors recoverable?
                // should they be handled in this method, or ad-hoc?
                // TODO: log the actual error
                // Let the game know this client failed.
                self.send_message(Message::Disconnected);
                // TODO: what do when this fails?
                self.write_messages().expect("could not write messages");
                // terminate the task
                Async::Ready(())
            }
        })
    }
}



// This is rather temporary.
type Transport = Framed<BotHandle, LineCodec>;

struct LineCodec;

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
