// Code adapted from tokio_io::length_delimited and prost.

use prost::{Message, EncodeError, DecodeError};
use prost::encoding;
use std::marker::PhantomData;
use bytes::{BytesMut, Buf, BufMut};
use std::io::{Result, Error, ErrorKind, Cursor};

use std::cmp::min;

use tokio_io::codec;


struct LengthDelimited {
    decoder_state: DecoderState,
}

enum DecoderState {
    Head,
    Data(usize),
}

impl LengthDelimited {
    fn new() -> Self {
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