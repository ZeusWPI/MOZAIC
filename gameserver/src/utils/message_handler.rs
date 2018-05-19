use std::collections::HashMap;
use std::time::Instant;

use bytes::BytesMut;
use prost::Message as ProtobufMessage;
use futures::{Poll, Async};


use protocol::message as proto;
use protocol::Message as MessageWrapper;

use utils::timeout_heap::TimeoutHeap;


mod errors {
    error_chain! {
        types {
            Error, ErrorKind, ResultExt;
        }

        errors {
            EmptyMessage
            UnsolicitedResponse(message_id: super::MessageId) {
                description("unsolicited response"),
                display(
                    "received unsolicited response to message number {}",
                    message_id.0
                ),
            }
        }

        foreign_links {
            Decode(::prost::DecodeError);
        }
    }
}

pub use self::errors::{Error, ErrorKind};


#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct MessageId(u64);

pub enum Message {
    Message {
        message_id: MessageId,
        data: Vec<u8>,
    },
    Response {
        request_num: usize,
        data: Vec<u8>,
    }
}


fn encode_message(id: MessageId, data: Vec<u8>) -> Vec<u8> {
    let MessageId(message_id) = id;
    let message = proto::Message { message_id, data };
    let payload = proto::Payload::Message(message);
    return encode_payload(payload);
}

fn encode_response(id: MessageId, data: Vec<u8>) -> Vec<u8> {
    let MessageId(message_id) = id;
    let response = proto::Response { message_id, data };
    let payload = proto::Payload::Response(response);
    return encode_payload(payload);
}

fn encode_payload(payload: proto::Payload) -> Vec<u8> {
    let message = MessageWrapper {
        payload: Some(payload),
    };

    let mut bytes = BytesMut::with_capacity(message.encoded_len());
    // encoding can only fail because the buffer does not have
    // enough space allocated, but we just allocated the required
    // space.
    message.encode(&mut bytes).unwrap();
    return bytes.to_vec();
}

pub struct MessageHandler {
    message_counter: u64,
    timeout_heap: TimeoutHeap<MessageId>,
    requests: HashMap<MessageId, usize>,
}

impl MessageHandler {
    pub fn new() -> Self {
        MessageHandler {
            message_counter: 0,
            timeout_heap: TimeoutHeap::new(),
            requests: HashMap::new(),
        }
    }

    pub fn create_message(&mut self, data: Vec<u8>)
        -> Vec<u8>
    {
        return encode_message(self.next_message_id(), data);
    }

    pub fn create_response(&mut self, message_id: MessageId, data: Vec<u8>)
        -> Vec<u8>
    {
        return encode_response(message_id, data);
    }

    pub fn create_request(&mut self,
                          request_num: usize,
                          data: Vec<u8>,
                          deadline: Instant)
                          -> Vec<u8>
    {
        let message_id = self.next_message_id();
        self.timeout_heap.set_timeout(message_id, deadline);
        self.requests.insert(message_id, request_num);
        return encode_message(message_id, data);
    }

    pub fn handle_message(&mut self, bytes: Vec<u8>)
        -> Result<Message, Error>
    {
        let wrapper = try!(MessageWrapper::decode(bytes));

        match wrapper.payload {
            None => {
                bail!(ErrorKind::EmptyMessage);
            },
            Some(proto::Payload::Message(message)) => {
                let message_id = MessageId(message.message_id);

                Ok(Message::Message {
                    message_id,
                    data: message.data,
                })
            },
            Some(proto::Payload::Response(response)) => {
                let message_id = MessageId(response.message_id);

                let request_num = match self.requests.remove(&message_id) {
                    Some(request_num) => request_num,
                    None => {
                        bail!(ErrorKind::UnsolicitedResponse(message_id));
                    }
                };

                Ok(Message::Response {
                    request_num,
                    data: response.data
                })
            },
        }
    }

    pub fn poll_timeout(&mut self) -> Poll<usize, ()> {
        loop {
            let message_id = try_ready!(self.timeout_heap.poll());
            if let Some(request_num) = self.requests.remove(&message_id) {
                return Ok(Async::Ready(request_num));
            }
        }
    }

    fn next_message_id(&mut self) -> MessageId {
        let message_num = self.message_counter;
        self.message_counter += 1;
        return MessageId(message_num);
    }
}