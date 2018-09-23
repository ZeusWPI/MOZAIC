use futures::{Poll, Async, Stream, Sink, StartSend, AsyncSink};
use futures::sync::mpsc;
use prost::Message;
use std::io;

pub enum TransportInstruction {
    Send {
        channel_num: u32,
        data: Vec<u8>,
    },
    Close {
        channel_num: u32,
    }
}

pub struct Channel {
    channel_num: u32,
    receiver: mpsc::Receiver<Vec<u8>>,
    sender: mpsc::Sender<TransportInstruction>,
    /// Sender that is reserved for sending the drop instruction.
    /// Since senders have one guaranteed slot sending this instruction
    /// can not fail given that we did not use the sender before.
    drop_sender: mpsc::Sender<TransportInstruction>,
}

impl Channel {
    pub fn create(channel_num: u32, sender: mpsc::Sender<TransportInstruction>)
        -> (mpsc::Sender<Vec<u8>>, Self)
    {
        // TODO: what channel size to pick?
        let (s, receiver) = mpsc::channel(32);

        let channel = Channel {
            channel_num,
            drop_sender: sender.clone(),
            sender,
            receiver,
        };

        return (s, channel);
    }

    pub fn poll_ready(&mut self) -> Poll<(), ()> {
        let poll = self.sender.poll_ready().unwrap();
        return Ok(poll);
    }


    /// make sure sink is ready before calling this
    pub fn send_protobuf<M>(&mut self, msg: M) -> io::Result<()>
        where M: Message
    {
        let mut bytes = Vec::with_capacity(msg.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        msg.encode(&mut bytes).unwrap();

        match try!(self.start_send(bytes)) {
            AsyncSink::Ready => Ok(()),
            AsyncSink::NotReady(_) => panic!("sink was not ready"),
        }
    }

    pub fn poll_frame(&mut self) -> Poll<Vec<u8>, io::Error> {
        match self.poll().unwrap() {
            Async::NotReady => Ok(Async::NotReady),
            Async::Ready(None) => bail!(io::ErrorKind::ConnectionAborted),
            Async::Ready(Some(bytes)) => Ok(Async::Ready(bytes)),
        }
    }
}

impl Stream for Channel {
    type Item = Vec<u8>;
    type Error = ();

    fn poll(&mut self) -> Poll<Option<Vec<u8>>, ()> {
        self.receiver.poll()
    }
}

impl Sink for Channel {
    type SinkItem = Vec<u8>;
    type SinkError = io::Error;

    fn start_send(&mut self, item: Vec<u8>) -> StartSend<Vec<u8>, io::Error> {
        match self.poll_ready() {
            Ok(Async::Ready(())) => {
                let instruction = TransportInstruction::Send {
                    channel_num: self.channel_num,
                    data: item,
                };
                let poll = self.sender.start_send(instruction).unwrap();
                assert!(poll.is_ready());
                return Ok(AsyncSink::Ready);
            }
            Ok(Async::NotReady) => {
                return Ok(AsyncSink::NotReady(item));
            }
            Err(()) => {
                bail!(io::ErrorKind::ConnectionAborted)
            }
        }
    }

    fn poll_complete(&mut self) -> Poll<(), io::Error> {
        match self.sender.poll_complete() {
            Ok(async) => Ok(async),
            Err(_) => bail!(io::ErrorKind::ConnectionAborted),
        }
    }
}

impl Drop for Channel {
    fn drop(&mut self) {
        let channel_num = self.channel_num;
        let res = self.drop_sender.try_send(
            TransportInstruction::Close { channel_num }
        );
        if let Err(err) = res {
            if err.is_full() {
                panic!("could not send close because channel was full");
            }
        }
    }
}
