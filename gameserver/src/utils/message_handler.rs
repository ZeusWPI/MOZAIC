use std::collections::HashMap;
use std::time::Instant;

use bytes::BytesMut;
use prost::{Message as ProtobufMessage, DecodeError};
use futures::{Poll, Async};


use protocol::message as proto;
use protocol::Message as MessageWrapper;

use utils::timeout_heap::TimeoutHeap;


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


fn encode_message(message_id: u64, data: Vec<u8>) -> Vec<u8> {
    let message = proto::Message { message_id, data };
    let payload = proto::Payload::Message(message);
    return encode_payload(payload);
}

fn encode_response(message_id: u64, data: Vec<u8>) -> Vec<u8> {
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
    timeout_heap: TimeoutHeap<u64>,
    requests: HashMap<u64, usize>,
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
        let message_id = self.next_message_id();
        return encode_message(message_id, data);
    }

    pub fn create_response(&mut self, message_id: MessageId, data: Vec<u8>)
        -> Vec<u8>
    {
        
        let MessageId(id) = message_id;
        return encode_response(id, data);
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

    pub fn handle_message(&mut self, bytes: Vec<u8>) -> Result<Message, ()> {
        let wrapper = match MessageWrapper::decode(bytes) {
            Err(_err) => unimplemented!(),
            Ok(message) => message,
        };

        match wrapper.payload {
            None => {
                unimplemented!()
            },
            Some(proto::Payload::Message(message)) => {
                return Ok(Message::Message {
                    message_id: MessageId(message.message_id),
                    data: message.data,
                });
            },
            Some(proto::Payload::Response(response)) => {
                let request_num = self.requests
                    .remove(&response.message_id)
                    .unwrap();

                return Ok(Message::Response {
                    request_num,
                    data: response.data
                });                
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

    fn next_message_id(&mut self) -> u64 {
        let message_id = self.message_counter;
        self.message_counter += 1;
        return message_id;
    }
}