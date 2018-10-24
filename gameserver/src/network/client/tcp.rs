use std::collections::HashMap;
use std::io;
use tokio;

use futures::{Future, Poll, Async, Stream, Sink};
use futures::sync::mpsc;
use tokio::net::TcpStream;
use sodiumoxide::crypto::sign::SecretKey;


use network::lib::protobuf_codec::{MessageStream, ProtobufTransport};
use network::lib::channel::{TransportInstruction, Channel};
use network::lib::ConnectionHandle;
use super::handshake::Handshaker;

use protocol as proto;

struct TcpStreamTransport {
    stream: MessageStream<TcpStream, proto::Frame>,

    // we need two different mpsc channels to provide the same interface
    // between client- and server side transports.
    snd: mpsc::Sender<TransportInstruction>,
    recv: mpsc::Receiver<TransportInstruction>,

    channels: HashMap<u32, mpsc::Sender<Vec<u8>>>,
}

impl TcpStreamTransport {
    pub fn new(stream: TcpStream) -> Self {
        let (snd, recv) = mpsc::channel(32);
       
       TcpStreamTransport {
            stream: MessageStream::new(ProtobufTransport::new(stream)),
            channels: HashMap::new(),
            snd,
            recv,
        }
    }

    pub fn open_channel(&mut self, channel_num: u32) -> Channel {
        let (sender, channel) = Channel::create(channel_num, self.snd.clone());
        self.channels.insert(channel_num, sender);
        return channel;
    }

    fn poll_stream(&mut self) -> Poll<(), io::Error> {
        loop {
            let frame = match try_ready!(self.stream.poll()) {
                Some(frame) => frame,
                None => return Ok(Async::Ready(())),
            };

            match self.channels.get_mut(&frame.channel_num) {
                None => {
                    eprintln!("got packet for non-existing channel");
                }
                Some(channel) => {
                    channel.try_send(frame.data)
                        .expect("sending failed");
                }
            }
        }
    }

    fn poll_instructions(&mut self) -> Poll<(), io::Error> {
        loop {
            // make sure we will be able to write to the stream
            // before pulling an instruction from the control channel
            try_ready!(self.stream.poll_complete());

            let instruction = match self.recv.poll().unwrap() {
                Async::Ready(msg) => msg.unwrap(),
                Async::NotReady => return Ok(Async::NotReady),
            };

            match instruction {
                TransportInstruction::Send { channel_num, data } => {
                    let frame = proto::Frame { channel_num, data };
                    let res = try!(self.stream.start_send(frame));
                    assert!(res.is_ready(), "writing to MessageStream blocked");

                }
                TransportInstruction::Close { channel_num } => {
                    self.channels.remove(&channel_num);
                }
            }
        }
    }
}

impl Future for TcpStreamTransport {
    type Item = ();
    type Error = io::Error;
    
    fn poll(&mut self) -> Poll<(), io::Error> {
        try!(self.poll_instructions());
        return self.poll_stream();
    }
}




pub struct ConnectParams {
    pub secret_key: SecretKey,
    pub message: Vec<u8>,
    pub conn_handle: ConnectionHandle,
}

enum TransportControlMessage {
    Connect(ConnectParams),
}

pub struct TransportDriver {
    transport: TcpStreamTransport,

    ctrl_chan: mpsc::UnboundedReceiver<TransportControlMessage>,

    chan_counter: u32,
}

impl TransportDriver {
    pub fn new(stream: TcpStream)
        -> (TransportControl, Self)
    {
        let (snd, recv) = mpsc::unbounded();

        let driver = TransportDriver {
            chan_counter: 0,
            ctrl_chan: recv,

            transport: TcpStreamTransport::new(stream),
        };

        let control = TransportControl { sender: snd };

        return (control, driver);
    }

    fn handle_ctrl_msg(&mut self, msg: TransportControlMessage) {
        match msg {
            TransportControlMessage::Connect(params) => {
                let channel_num = self.get_channel_num();
                let channel = self.transport.open_channel(channel_num);
                let handshaker = Handshaker::new(
                    channel,
                    params.secret_key,
                    params.message,
                    params.conn_handle,
                );
                tokio::spawn(handshaker);
            }
        }
    }

    fn get_channel_num(&mut self) -> u32 {
        let num = self.chan_counter;
        self.chan_counter += 1;
        return num;
    }

    fn poll_commands(&mut self) {
        loop {
            let msg = match self.ctrl_chan.poll() {
                Err(err) => panic!(err),
                Ok(Async::NotReady) => return,
                Ok(Async::Ready(None)) => return, // TODO: handle this
                Ok(Async::Ready(Some(item))) => item,
            };

            self.handle_ctrl_msg(msg);
        }
    }
}

impl Future for TransportDriver {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        self.poll_commands();
        match self.transport.poll() {
            Ok(status) => Ok(status),
            Err(err) => panic!(err), // TODO
        }
    }
}

pub struct TransportControl {
    sender: mpsc::UnboundedSender<TransportControlMessage>,
}

impl TransportControl {
    pub fn connect(&mut self, params: ConnectParams) {
        self.sender
            .unbounded_send(TransportControlMessage::Connect(params))
            .unwrap();
    }
}
