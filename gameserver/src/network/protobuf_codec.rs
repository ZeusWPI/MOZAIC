// Code adapted from tokio_io::length_delimited and prost.

use prost::Message;
use prost::encoding;
use bytes::BytesMut;
use std::io::{Result, Error, ErrorKind, Cursor};
use futures::{Poll, Async, Stream, StartSend, AsyncSink};
use futures::sink::{Sink, Send};
use std::marker::PhantomData;

use tokio_codec::{Decoder, Encoder, Framed};
use tokio_io::{AsyncRead, AsyncWrite};

pub struct MessageStream<T, M> {
    inner: ProtobufTransport<T>,
    buffered: Option<BytesMut>,
    phantom_m: PhantomData<M>,
}

impl<T, M> Stream for MessageStream<T, M>
    where T: AsyncRead,
          M: Message + Default
{
    type Item = M;
    type Error = Error;

    fn poll(&mut self) -> Poll<Option<M>, Error> {
        let res = match try_ready!(self.inner.poll()) {
            None => None,
            Some(bytes_mut) => {
                let bytes = bytes_mut.freeze();
                let msg = try!(M::decode(bytes));
                Some(msg)
            }
        };
        return Ok(Async::Ready(res));
    }
}

impl<T, M> MessageStream<T, M>
    where T: AsyncRead + AsyncWrite,
          M: Message
{
    pub fn new(transport: ProtobufTransport<T>) -> Self {
        MessageStream {
            inner: transport,
            buffered: None,
            phantom_m: PhantomData,
        }
    }

    fn poll_send(&mut self) -> Poll<(), Error> {
        if let Some(bytes) = self.buffered.take() {
            match try!(self.inner.start_send(bytes)) {
                AsyncSink::Ready => (),
                AsyncSink::NotReady(bytes) => {
                    self.buffered = Some(bytes);
                    return Ok(Async::NotReady);
                }
            }
        }
        return Ok(Async::Ready(()));
    }
}

impl<T, M> Sink for MessageStream<T, M>
    where T: AsyncRead + AsyncWrite,
          M: Message
{
    type SinkItem = M;
    type SinkError = Error;

    fn start_send(&mut self, item: M) -> StartSend<M, Error> {
        match try!(self.poll_send()) {
            Async::NotReady => Ok(AsyncSink::NotReady(item)),
            Async::Ready(()) => {
                let mut bytes = BytesMut::with_capacity(item.encoded_len());
                // encoding can only fail because the buffer does not have
                // enough space allocated, but we just allocated the required
                // space.
                item.encode(&mut bytes).unwrap();
                self.buffered = Some(bytes);
                Ok(AsyncSink::Ready)
            }
        }
    }

    fn poll_complete(&mut self) -> Poll<(), Error> {
        let res = try!(self.poll_send());
        try_ready!(self.inner.poll_complete());
        return Ok(res);
    }
}

pub struct ProtobufTransport<T> {
    inner: Framed<T, LengthDelimited>,
}

impl<T> ProtobufTransport<T>
    where T: AsyncRead + AsyncWrite
{
    pub fn new(stream: T) -> Self {
        ProtobufTransport {
            inner: LengthDelimited::new().framed(stream),
        }
    }

    pub fn send_msg<M>(self, msg: M) -> Send<Self>
        where M: Message
    {
        let mut bytes = BytesMut::with_capacity(msg.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        msg.encode(&mut bytes).unwrap();
        return self.send(bytes);
    }

    pub fn poll_msg<M>(&mut self) -> Poll<Option<M>, Error>
        where M: Message + Default
    {
        let res = match try_ready!(self.poll()) {
            None => None,
            Some(bytes_mut) => {
                let bytes = bytes_mut.freeze();
                let msg = try!(M::decode(bytes));
                Some(msg)
            },
        };
        return Ok(Async::Ready(res));
    }
}

impl<T> Stream for ProtobufTransport<T>
    where T: AsyncRead
{
    type Item = BytesMut;
    type Error = Error;

    fn poll(&mut self) -> Poll<Option<BytesMut>, Error> {
        self.inner.poll()
    }
}

impl<T> Sink for ProtobufTransport<T>
    where T: AsyncWrite
{
    type SinkItem = BytesMut;
    type SinkError = Error;

    fn start_send(&mut self, item: BytesMut) -> StartSend<BytesMut, Error> {
        self.inner.start_send(item)
    }

    fn poll_complete(&mut self) -> Poll<(), Error> {
        self.inner.poll_complete()
    }
}

// ===== Varint-delimited codec ======

pub struct LengthDelimited {
    decoder_state: DecoderState,
}

enum DecoderState {
    Head,
    Data(usize),
}

impl LengthDelimited {
    pub fn new() -> Self {
        LengthDelimited {
            decoder_state: DecoderState::Head,
        }
    }

    fn decode_head(&self, buf: &mut BytesMut) -> Result<Option<usize>> {
        let mut cur = Cursor::new(buf);

        if let Ok(num) = encoding::decode_varint(&mut cur) {
            // num correctly parsed, advance buffer
            let pos = cur.position() as usize;
            cur.into_inner().split_to(pos);
            // TODO: properly handle this cast
            Ok(Some(num as usize))
        } else {
            if cur.position() < 10 {
                return Ok(None);
            } else {
                return Err(
                    Error::new(ErrorKind::Other, "invalid LEB128 number")
                );
            }
        }
    }

    fn decode_data(&mut self, n: usize, buf: &mut BytesMut)
        -> Result<Option<BytesMut>>
    {
        if buf.len() < n {
            return Ok(None);
        }

        Ok(Some(buf.split_to(n)))
    }
}

impl Decoder for LengthDelimited {
    type Item = BytesMut;
    type Error = Error;

    fn decode(&mut self, buf: &mut BytesMut) -> Result<Option<BytesMut>> {
        let n = match self.decoder_state {
            DecoderState::Head => {
                match try!(self.decode_head(buf)) {
                    Some(n) => {
                        self.decoder_state = DecoderState::Data(n);
                        n
                    },
                    None => return Ok(None),
                }
            },
            DecoderState::Data(n) => n,
        };

        match try!(self.decode_data(n, buf)) {
            Some(data) => {
                self.decoder_state = DecoderState::Head;
                Ok(Some(data))
            },
            None => Ok(None)
        }
    }
}

impl Encoder for LengthDelimited {
    type Item = BytesMut;
    type Error = Error;

    fn encode(&mut self, bytes: BytesMut, buf: &mut BytesMut) -> Result<()> {
        let num_bytes = bytes.len();
        let head_len = encoding::encoded_len_varint(num_bytes as u64);
        buf.reserve(head_len + num_bytes);
        encoding::encode_varint(num_bytes as u64, buf);
        buf.extend(bytes);
        Ok(())
    }
}