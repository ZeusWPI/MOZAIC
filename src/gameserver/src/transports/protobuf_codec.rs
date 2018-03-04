// Code adapted from tokio_io::length_delimited and prost.

use prost::{encoding, Message};
use bytes::BytesMut;
use std::io::{Result, Error, ErrorKind, Cursor};
use std::marker::PhantomData;
use futures::{Poll, Async, Sink, Stream, StartSend, AsyncSink};

use tokio_io::{codec, AsyncRead, AsyncWrite};

pub struct MessageTransport<T, M> {
    inner: ProtobufTransport<T>,
    phantom_m: PhantomData<M>,
    buffered: Option<BytesMut>,
}

impl<T, M> MessageTransport<T, M>
    where T: AsyncRead + AsyncWrite
{
    pub fn new(stream: T) -> Self {
        MessageTransport {
            inner: ProtobufTransport::new(stream),
            phantom_m: PhantomData,
            buffered: None,
        }
    }
}

impl<T, M> Stream for MessageTransport<T, M>
    where T: AsyncRead,
          M: Message + Default
{
    type Item = M;
    type Error = Error;

    fn poll(&mut self) -> Poll<Option<M>, Error> {
        let item = match try_ready!(self.inner.poll()) {
            None => None,
            Some(buf) => {
                let msg = try!(M::decode(buf.freeze()));
                Some(msg)
            }
        };
        return Ok(Async::Ready(item));
    }
}

impl<T, M> Sink for MessageTransport<T, M>
    where T: AsyncWrite,
          M: Message
{
    type SinkItem = M;
    type SinkError = Error;

    fn start_send(&mut self, msg: M) -> StartSend<M, Error> {
        let mut buf = BytesMut::with_capacity(msg.encoded_len());
        try!(msg.encode(&mut buf));
        return Ok(AsyncSink::Ready);
    }

    fn poll_complete(&mut self) -> Poll<(), Error> {
        if let Some(bytes) = self.buffered.take() {
            if let AsyncSink::NotReady(bytes) = self.inner.start_send(bytes)? {
                self.buffered = Some(bytes);
                return Ok(Async::NotReady);
            }
        }
        return self.inner.poll_complete();
    }
}


pub struct ProtobufTransport<T> {
    inner: codec::Framed<T, LengthDelimited>,
}

impl<T> ProtobufTransport<T>
    where T: AsyncRead + AsyncWrite
{
    pub fn new(stream: T) -> Self {
        ProtobufTransport {
            inner: stream.framed(LengthDelimited::new()),
        }
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

impl codec::Decoder for LengthDelimited {
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

impl codec::Encoder for LengthDelimited {
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