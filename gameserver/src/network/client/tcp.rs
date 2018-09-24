use std::collections::HashMap;

use futures::{Future, Poll, Async, Stream, Sink};
use futures::sync::mpsc;
use tokio::net::TcpStream;
use std::io;

use network::lib::protobuf_codec::{MessageStream, ProtobufTransport};
use network::lib::channel::{TransportInstruction, Channel};

use protocol as proto;

struct TcpStreamTransport {
    stream: MessageStream<TcpStream, proto::Frame>,
    recv: mpsc::Receiver<TransportInstruction>,
    snd: mpsc::Sender<TransportInstruction>,
    channels: HashMap<u32, mpsc::Sender<Vec<u8>>>,
}

impl TcpStreamTransport {
    pub fn new(stream: TcpStream) -> Self {
        let (snd, recv) = mpsc::channel(32);
        TcpStreamTransport {
            stream: MessageStream::new(ProtobufTransport::new(stream)),
            channels: HashMap::new(),
            recv,
            snd,
        }
    }

    pub fn poll_stream(&mut self) -> Poll<(), io::Error> {
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

    pub fn poll_instructions(&mut self) -> Poll<(), io::Error> {
        loop {
            // make sure stream is ready to write to before handling an
            // instruction
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

    pub fn poll_(&mut self) -> Poll<(), io::Error> {
        try!(self.poll_instructions());
        return self.poll_stream();
    }

}

impl Future for TcpStreamTransport {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.poll_() {
            Ok(async) => Ok(async),
            Err(err) => panic!(err),
        }
    }
}