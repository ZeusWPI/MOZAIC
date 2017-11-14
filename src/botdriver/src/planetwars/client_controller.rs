use futures::{Future, Poll, Async};
use futures::stream::{Stream, StreamFuture, SplitStream, SplitSink};
use tokio_io::codec::Framed;
use tokio_io::codec::{Encoder, Decoder};
use bytes::{BytesMut, BufMut};
use std::io;
use std::str;

use bot_runner::BotHandle;
use planetwars::writer::Writer;


// This is rather temporary.
type Transport = Framed<BotHandle, LineCodec>;

struct ClientController {
    client_id: usize,
    
    writer: Writer<SplitSink<Transport>>,
    receive: StreamFuture<SplitStream<Transport>>,
}

impl ClientController {
    fn poll_client(&mut self) -> Poll<String, io::Error> {
        let poll = self.receive.poll().map_err(|(err, stream)| err);
        let (item, stream) = try_ready!(poll);
        // update receive future
        self.receive = stream.into_future();
        // TODO: don't unwrap
        Ok(Async::Ready(item.unwrap()))
    }
}

impl Future for ClientController {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        // for now, assume errors don't happen
        let write = self.writer.poll().unwrap();
        let read = self.poll_client().unwrap();
        Ok(Async::NotReady)
    }
}


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

    fn decode(&mut self, buf: &mut BytesMut) -> Result<Option<String>, io::Error> {
        // Check to see if the frame contains a new line
        if let Some(n) = buf.as_ref().iter().position(|b| *b == b'\n') {
            // remove line from buffer
            let line = buf.split_to(n);

            // remove newline
            buf.split_to(1);

            // Try to decode the line as UTF-8
            return match str::from_utf8(&line.as_ref()) {
                Ok(s) => Ok(Some(s.to_string())),
                Err(_) => Err(io::Error::new(io::ErrorKind::Other, "invalid string")),
            }
        }

        Ok(None)
    }
}
