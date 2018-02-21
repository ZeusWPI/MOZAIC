// Code adapted from tokio_io::length_delimited and prost.

use prost::{Message, EncodeError, DecodeError};
use prost::encoding::decode_varint;
use std::marker::PhantomData;
use bytes::{BytesMut, Buf, BufMut};
use std::io::{Result, Error, ErrorKind, Cursor};

use std::cmp::min;

use tokio_io::codec;


struct Decoder {
    state: DecoderState,
}

enum DecoderState {
    Head,
    Data(usize),
}

impl Decoder {
    fn decode_len(&mut self, buf: &mut BytesMut) -> Result<Option<usize>> {
        let mut cur = Cursor::new(buf);
        let mut value : u64 = 0;

        // TODO: can this be implemented in a prettier way?
        for byte_num in 0..min(10, cur.remaining()) {
            let byte = cur.get_u8();
            value |= ((byte & 0x7F) as u64) << (byte_num * 7);
            if byte <= 0x7F {
                // Remove parsed bytes and return their parsed value
                cur.into_inner().split_to(byte_num);
                // for now, assume there is no overflow
                let num = value as usize;
                return Ok(Some(num));
            }
        }

        if cur.remaining() == 0 {
            return Ok(None);
        } else {
            return Err(Error::new(ErrorKind::Other, "invalid LEB128 number"));
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

impl codec::Decoder for Decoder {
    type Item = BytesMut;
    type Error = Error;

    fn decode(&mut self, buf: &mut BytesMut) -> Result<Option<BytesMut>> {
        let n = match self.state {
            DecoderState::Head => {
                match try!(self.decode_len(buf)) {
                    Some(n) => {
                        self.state = DecoderState::Data(n);
                        n
                    },
                    None => return Ok(None),
                }
            },
            DecoderState::Data(n) => n,
        };

        match try!(self.decode_data(n, buf)) {
            Some(data) => {
                self.state = DecoderState::Head;
                Ok(Some(data))
            },
            None => Ok(None)
        }
    }
}