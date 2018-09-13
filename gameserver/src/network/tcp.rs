use futures::{Future, Poll, Async, Stream, Sink, StartSend, AsyncSink};
use futures::sink;
use futures::sync::mpsc;
use prost::Message;
use std::io;
use std::mem;
use std::net::SocketAddr;
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};
use std::collections::HashMap;
use bytes::BytesMut;

use super::protobuf_codec::{ProtobufTransport, MessageStream};
use super::connection_handler::ConnectionHandle;
use super::connection_table::ConnectionData;
use super::connection_router::{Router, ConnectionRouter};
use protocol as proto;


pub struct Listener<R>
    where R: Router
{
    incoming: Incoming,
    router: ConnectionRouter<R>,
}

impl<R> Listener<R>
    where R: Router + Send + 'static
{
    pub fn new(addr: &SocketAddr, router: ConnectionRouter<R>)
        -> io::Result<Self>
    {
        TcpListener::bind(addr).map(|tcp_listener| {
            Listener {
                router,
                incoming: tcp_listener.incoming(),
            }
        })
    }

    fn handle_connections(&mut self) -> Poll<(), io::Error> {
        // just make sure the user is aware of this
        println!("Olivier is een letterlijke god");

        while let Some(raw_stream) = try_ready!(self.incoming.poll()) {
            let handler = TcpStreamHandler::new(
                self.router.clone(),
                raw_stream
            );
            tokio::spawn(handler);
        }
        return Ok(Async::Ready(()));
    }
}

impl<R> Future for Listener<R>
    where R: Router + Send + 'static
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.handle_connections() {
            Ok(async) => return Ok(async),
            // TODO: gracefully handle this
            Err(e) => panic!("error: {}", e),
        }
    }
}

pub enum TransportInstruction {
    Send {
        channel_num: u32,
        data: Vec<u8>,
    },
    Close {
        channel_num: u32,
    }
}

struct TcpStreamHandler<R>
    where R: Router
{
    stream: MessageStream<TcpStream, proto::Frame>,
    recv: mpsc::Receiver<TransportInstruction>,
    snd: mpsc::Sender<TransportInstruction>,
    connections: HashMap<u32, mpsc::Sender<Vec<u8>>>,
    router: ConnectionRouter<R>,
}

impl<R> TcpStreamHandler<R>
    where R: Router + Send + 'static
{
    pub fn new(router: ConnectionRouter<R>, stream: TcpStream) -> Self {
        // TODO: what channel size should we use?
        let (snd, recv) = mpsc::channel(32);
        TcpStreamHandler {
            stream: MessageStream::new(ProtobufTransport::new(stream)),
            connections: HashMap::new(),
            router,
            recv,
            snd,
        }
    }

    pub fn poll_stream(&mut self) -> Poll<(), io::Error> {
        loop {
            let frame = match try_ready!(self.stream.poll()) {
                Some(frame) => frame,
                None => return Ok(Async::Ready(())),
            };

            // take references to satisfy the borrow checker
            let snd = &self.snd;
            let router = &self.router;

            let sender = self.connections.entry(frame.channel_num)
                .or_insert_with(|| {
                    let (sender, channel) = Channel::create(
                        frame.channel_num,
                        snd.clone(),
                    );
                    let handler = ConnectionHandler::new(
                        router.clone(),
                        channel,
                    );
                    tokio::spawn(handler);
                    return sender;
                });
            // TODO: handle this cleanly
            let res = sender.start_send(frame.data);
            if res != Ok(AsyncSink::Ready) {
                eprintln!("handler is {:?}", res);
            }
        }
    }

    pub fn poll_instructions(&mut self) -> Poll<(), io::Error> {
        loop {
            try_ready!(self.stream.poll_complete());
            let instruction = match self.recv.poll().unwrap() {
                Async::Ready(msg) => msg.unwrap(),
                Async::NotReady => return Ok(Async::NotReady),
            };
            match instruction {
                TransportInstruction::Send { channel_num, data } => {
                    let frame = proto::Frame { channel_num, data };
                    let res = try!(self.stream.start_send(frame));
                    assert!(res.is_ready(), "writing to MessageStream blocked");

                }
                TransportInstruction::Close { channel_num } => {
                    self.connections.remove(&channel_num);
                }
            }
        }
    }

    pub fn poll_(&mut self) -> Poll<(), io::Error> {
        try!(self.poll_instructions());
        return self.poll_stream();
    }
}

impl<R> Future for TcpStreamHandler<R>
    where R: Router + Send + 'static
{
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.poll_() {
            Ok(async) => Ok(async),
            Err(_) => Ok(Async::Ready(())),
        }
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

    pub fn send_protobuf<M>(self, msg: M) -> sink::Send<Self>
        where M: Message
    {
        let mut bytes = BytesMut::with_capacity(msg.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        msg.encode(&mut bytes).unwrap();
        return self.send(bytes.to_vec());
    }

    pub fn send_close(&mut self) -> Poll<(), ()> {
        let instruction = TransportInstruction::Close {
            channel_num: self.channel_num,
        };
        match self.sender.start_send(instruction).unwrap() {
            AsyncSink::NotReady(_ins) => Ok(Async::NotReady),
            AsyncSink::Ready => Ok(Async::Ready(())),
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
        self.drop_sender
            .try_send(TransportInstruction::Close { channel_num })
            .expect("failed to send drop");
    }
}

fn connection_success() -> proto::ConnectionResponse {
   proto::ConnectionResponse {
        response: Some(
            proto::connection_response::Response::Success(
                proto::ConnectionSuccess { }
            )
        )
    }
}

fn connection_error(msg: String) -> proto::ConnectionResponse {
    proto::ConnectionResponse {
        response: Some(
            proto::connection_response::Response::Error(
                proto::ConnectionError {
                    message: msg,
                }
            )
        )
    }
}

struct Waiting<R: Router> {
    channel: Channel,
    router: ConnectionRouter<R>,
}

enum Action {
    Accept {
        data: ConnectionData,
    },
    Refuse {
        reason: String,
    }
}

impl<R: Router> Waiting<R> {
    fn poll(&mut self) -> Poll<Action, io::Error>
    {
        let bytes = match self.channel.poll().unwrap() {
            Async::NotReady => return Ok(Async::NotReady),
            Async::Ready(None) => bail!(io::ErrorKind::ConnectionAborted),
            Async::Ready(Some(bytes)) => bytes,
        };

        let request = try!(proto::ConnectionRequest::decode(bytes));

        let action = match self.router.route(&request.message) {
            Err(err) => Action::Refuse { reason: err.to_string() },
            Ok(data) => Action::Accept { data },
        };
        return Ok(Async::Ready(action));
    }

    fn step(self, action: Action) -> HandlerState<R> {
        match action {
            Action::Accept { data } => {
                let response = connection_success();
                let accepting = Accepting {
                    send: self.channel.send_protobuf(response),
                    handle: data.handle,
                };
                return HandlerState::Accepting(accepting);
            },
            Action::Refuse { reason } => {
                let response = connection_error(reason);

                let refusing = Refusing {
                    send: self.channel.send_protobuf(response),
                };
                return HandlerState::Refusing(refusing);
            }
        }
    }
}


struct Accepting {
    send: sink::Send<Channel>,
    handle: ConnectionHandle,
}

impl Accepting {
    fn poll(&mut self) -> Poll<Channel, io::Error> {
        self.send.poll()
    }

    fn step<R: Router>(mut self, channel: Channel)
        -> HandlerState<R>
    {
        // TODO
        self.handle.connect(channel);
        return HandlerState::Done;
    }
}

struct Refusing {
    send: sink::Send<Channel>,
}

impl Refusing {
    fn poll(&mut self) -> Poll<(), io::Error> {
        try_ready!(self.send.poll());
        return Ok(Async::Ready(()));
    }

    fn step<R: Router>(self) -> HandlerState<R> {
        return HandlerState::Done;
    }
}

enum HandlerState<R: Router> {
    Waiting(Waiting<R>),
    Accepting(Accepting),
    Refusing(Refusing),
    Done,
}

pub struct ConnectionHandler<R: Router> {
    state: HandlerState<R>,
}

impl<R: Router> ConnectionHandler<R> {
    pub fn new(router: ConnectionRouter<R>,
               channel: Channel) -> Self
    {
        ConnectionHandler {
            state: HandlerState::Waiting(Waiting {
                channel,
                router,
            }),
        }
    }
}

impl<R: Router> ConnectionHandler<R> {
    // TODO: can we get rid of this boilerplate?
    fn step(&mut self) -> Poll<(), io::Error> {
        loop {
            let state = mem::replace(&mut self.state, HandlerState::Done);
            match state {
                HandlerState::Waiting(mut waiting) => {
                    match try!(waiting.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Waiting(waiting);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(action) => {
                            self.state = waiting.step(action);
                        }
                    }
                }
                HandlerState::Accepting(mut accepting) => {
                    match try!(accepting.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Accepting(accepting);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(transport) => {
                            self.state = accepting.step(transport);
                        }
                    }
                }
                HandlerState::Refusing(mut refusing) => {
                    match try!(refusing.poll()) {
                        Async::NotReady => {
                            self.state = HandlerState::Refusing(refusing);
                            return Ok(Async::NotReady);
                        }
                        Async::Ready(()) => {
                            self.state = refusing.step();
                        }
                    }
                }
                HandlerState::Done => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }
}

impl<R: Router> Future for ConnectionHandler<R> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.step() {
            // TODO: handle this case gracefully
            Err(err) => panic!("error: {}", err),
            Ok(poll) => Ok(poll),
        }
    }
}