use futures::{Future, Poll, Async, StartSend};
use futures::stream::{Stream, StreamFuture};
use futures::sink::{Sink, Send};
use tokio_io::AsyncRead;
use tokio_io::codec::{Encoder, Decoder, Framed};
use bytes::BytesMut;
use std::io;

use std::marker::PhantomData;
use serde_json;
use serde_json as json;
use serde::{Serialize, Deserialize};

use bot_runner::BotHandle;
use planetwars::protocol as proto;


pub struct PlayerHandle {
    id: usize,
    transport: Framed<BotHandle, JsonLines<proto::State, proto::Command>>,
}

impl PlayerHandle {
    pub fn new(id: usize, bot_handle: BotHandle) -> Self {
        PlayerHandle {
            id: id,
            transport: bot_handle.framed(JsonLines::new()),
        }
    }
    
    pub fn prompt(self, msg: proto::State) -> Prompt {
        Prompt::new(self, msg)
    }

    pub fn id(&self) -> usize {
        self.id
    }
}

impl Stream for PlayerHandle {
    type Item = json::Result<proto::Command>;
    type Error = io::Error;

    fn poll(&mut self) -> Poll<Option<Self::Item>, io::Error> {
        self.transport.poll()
    }
}

impl Sink for PlayerHandle {
    type SinkItem = proto::State;
    type SinkError = io::Error;

    fn start_send(&mut self, item: Self::SinkItem)
                  -> StartSend<Self::SinkItem, io::Error>
    {
        self.transport.start_send(item)
    }

    fn poll_complete(&mut self) -> Poll<(), io::Error> {
        self.transport.poll_complete()
    }
}

pub struct JsonLines<Enc, Dec> {
    phantom_enc: PhantomData<Enc>,
    phantom_dec: PhantomData<Dec>,
}

impl<Enc, Dec> JsonLines<Enc, Dec> {
    pub fn new() -> Self {
        JsonLines {
            phantom_enc: PhantomData,
            phantom_dec: PhantomData,
        }
    }
}


impl<Enc, Dec> Encoder for JsonLines<Enc, Dec>
    where Enc: Serialize
{
    type Item = Enc;
    type Error = io::Error;

    fn encode(&mut self, msg: Enc, buf: &mut BytesMut) -> io::Result<()> {
        let bytes = serde_json::to_vec(&msg)?;
        // TODO: avoid this copy
        buf.extend(&bytes);
        buf.extend(b"\n");
        Ok(())
    }
}

impl<Enc, Dec> Decoder for JsonLines<Enc, Dec>
    where Dec: for <'de> Deserialize<'de>
{
    type Item = serde_json::Result<Dec>;
    type Error = io::Error;

    fn decode(&mut self, buf: &mut BytesMut) -> io::Result<Option<Self::Item>> {
        if let Some(pos) = buf.iter().position(|&b| b == b'\n') {
            // remove frame from buffer
            let line = buf.split_to(pos);
            // remove newline
            buf.split_to(1);

            let res = serde_json::from_slice(&line);
            return Ok(Some(res));
        } else {
            Ok(None)
        }
    }
}

enum PromptState {
    Writing(Send<PlayerHandle>),
    Reading(StreamFuture<PlayerHandle>),
}

pub struct Prompt {
    state: PromptState,
}

impl Prompt {
    fn new(trans: PlayerHandle, msg: proto::State) -> Self {
        Prompt { state: PromptState::Writing(trans.send(msg)) }
    }
}

// TODO: properly handle errors
impl Future for Prompt {
    type Item = io::Result<(json::Result<proto::Command>, PlayerHandle)>;
    type Error = ();

    fn poll(&mut self) -> Poll<Self::Item, ()> {
        loop {
            let new_state;
            match self.state {
                PromptState::Writing(ref mut future) => {
                    let transport = match future.poll() {
                        Ok(Async::Ready(t)) => t,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err(err) => return Ok(Async::Ready(Err(err))),
                    };
                    new_state = PromptState::Reading(transport.into_future());
                },
                PromptState::Reading(ref mut future) => {
                    let (item, transport) = match future.poll() {
                        Ok(Async::Ready(p)) => p,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err((err, _handle)) => return Ok(Async::Ready(Err(err))),
                    };
                    return Ok(Async::Ready(Ok((item.unwrap(), transport))));
                }
            };
            self.state = new_state;
        }
    }
}
