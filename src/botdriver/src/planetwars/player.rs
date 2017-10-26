use futures::{Future, Poll, Async, StartSend};
use futures::stream::{Stream, StreamFuture};
use futures::sink::{Sink, Send};
use tokio_io::codec::{Encoder, Decoder, Framed};
use bytes::BytesMut;
use std::str;
use std::io;

use bot_runner::BotHandle;


pub struct PlayerHandle {
    id: usize,
    transport: Framed<BotHandle, LineCodec>,
}

impl PlayerHandle {
    pub fn prompt(self, msg: String) -> Prompt<PlayerHandle> {
        Prompt::new(self, msg)
    }

    pub fn id(&self) -> usize {
        self.id
    }
}

impl Stream for PlayerHandle {
    type Item = String;
    type Error = io::Error;

    fn poll(&mut self) -> Poll<Option<String>, io::Error> {
        self.transport.poll()
    }
}

impl Sink for PlayerHandle {
    type SinkItem = String;
    type SinkError = io::Error;

    fn start_send(&mut self, item: String) -> StartSend<String, io::Error> {
        self.transport.start_send(item)
    }

    fn poll_complete(&mut self) -> Poll<(), io::Error> {
        self.transport.poll_complete()
    }
}


pub struct LineCodec;

impl Encoder for LineCodec {
    type Item = String;
    type Error = io::Error;

    fn encode(&mut self, msg: String, buf: &mut BytesMut) -> io::Result<()> {
        buf.extend(msg.as_bytes());
        buf.extend(b"\n");
        Ok(())
    }
}

impl Decoder for LineCodec {
    type Item = String;
    type Error = io::Error;

    fn decode(&mut self, buf: &mut BytesMut) -> io::Result<Option<String>> {
        if let Some(pos) = buf.iter().position(|&b| b == b'\n') {
            // remove frame from buffer
            let line = buf.split_to(pos);

            // remove newline
            buf.split_to(1);

            match str::from_utf8(&line) {
                Ok(s)  => Ok(Some(s.to_string())),
                Err(_) => Err(io::Error::new(io::ErrorKind::Other, "invalid UTF-8")),
            }
        } else {
            Ok(None)
        }
    }
}

enum PromptState<T>
    where T: Stream + Sink
{
    Writing(Send<T>),
    Reading(StreamFuture<T>),
}

pub struct Prompt<T>
    where T: Stream + Sink
{
    state: PromptState<T>,
}

impl<T> Prompt<T>
    where T: Stream + Sink
{
    fn new(trans: T, msg: T::SinkItem) -> Self {
        Prompt { state: PromptState::Writing(trans.send(msg)) }
    }
}

// TODO: properly handle errors
impl<T> Future for Prompt<T>
    where T: Stream + Sink
{
    type Item = (T::Item, T);
    type Error = ();

    fn poll(&mut self) -> Poll<(T::Item, T), ()> {
        loop {
            let new_state;
            match self.state {
                PromptState::Writing(ref mut future) => {
                    let transport = match future.poll() {
                        Ok(Async::Ready(t)) => t,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err(e) => panic!("error"),
                    };
                    new_state = PromptState::Reading(transport.into_future());
                },
                PromptState::Reading(ref mut future) => {
                    let (item, transport) = match future.poll() {
                        Ok(Async::Ready(p)) => p,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err((err, transport)) => panic!("error"),
                    };
                    return Ok(Async::Ready((item.unwrap(), transport)));
                }
            };
            self.state = new_state;
        }
    }
}
