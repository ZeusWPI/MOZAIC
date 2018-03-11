use tokio::net::TcpStream;
use futures::{Future, Poll, Async, Stream, Sink, StartSend, AsyncSink};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};
use futures::sync::oneshot;
use prost::Message;
use std::io;
use bytes::BytesMut;

use protobuf_codec::ProtobufTransport;
use client_controller::Command as ClientControllerCommand;
use protocol;
use router;

struct Waiting;

impl Waiting {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        let bytes  = match try_ready!(data.conn_mut().poll()) {
            None => bail!(io::ErrorKind::ConnectionAborted),
            Some(bytes) => bytes,
        };

        let request = try!(protocol::ConnectRequest::decode(bytes.freeze()));
        // TODO: dont do this here
        // construct a request
        let (sender, receiver) = oneshot::channel();
        let table_cmd = router::TableCommand::Lookup {
            token: request.token,
            chan: sender
        };
        data.router_handle.unbounded_send(table_cmd).unwrap();
        let lookup = Lookup { receiver };
        return Ok(Async::Ready(HandlerState::Lookup(lookup)));
    }
}

struct Lookup {
    // TODO: eww.
    receiver: oneshot::Receiver<
        Option<UnboundedSender<ClientControllerCommand>>
    >,
}

impl Lookup {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        // TOOD: ideally this would not happen here
        let value = match self.receiver.poll() {
            Err(cancelled) => panic!("lookup cancelled"),
            Ok(Async::NotReady) => return Ok(Async::NotReady),
            Ok(Async::Ready(value)) => value,
        };
        let handle = match value {
            None => panic!("invalid token"),
            Some(handle) => handle, 
        };
        // TODO: this is not nice
        let response = protocol::ConnectResponse {
            response: Some(
                protocol::connect_response::Response::Connected(
                    protocol::Connected::default()
                )
            )
        };
        let mut buf = BytesMut::new();
        try!(response.encode(&mut buf));
        let accepting = Accepting {
            send: SendRef::new(buf),
            handle,
        };
        return Ok(Async::Ready(HandlerState::Accepting(accepting)));
    }
}

struct SendRef<T> {
    item: Option<T>,
}

impl<T> SendRef<T> {
    pub fn new(item: T) -> Self {
        SendRef {
            item: Some(item),
        }
    }

    pub fn poll_send<S>(&mut self, sink: &mut S) -> Poll<(), S::SinkError>
        where S: Sink<SinkItem = T>
    {
        if let Some(item) = self.item.take() {
            match try!(sink.start_send(item)) {
                AsyncSink::NotReady(item) => {
                    self.item = Some(item);
                    return Ok(Async::NotReady);
                },
                AsyncSink::Ready => (),
            }
        }

        return sink.poll_complete();
    }
}

struct Accepting {
    send: SendRef<BytesMut>,
    handle: UnboundedSender<ClientControllerCommand>,
}

impl Accepting {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        try_ready!(self.send.poll_send(data.conn_mut()));
        self.handle.unbounded_send(ClientControllerCommand::Connect(
            data.transport.take().unwrap()
        )).unwrap();
        return Ok(Async::Ready(HandlerState::Done));
    }
}

enum HandlerState {
    Waiting(Waiting),
    Lookup(Lookup),
    Accepting(Accepting),
    Done,
}

impl HandlerState {
    fn poll(&mut self, data: &mut HandlerData) -> Poll<HandlerState, io::Error>
    {
        match *self {
            HandlerState::Waiting(ref mut waiting) => waiting.poll(data),
            HandlerState::Lookup(ref mut lookup) => lookup.poll(data),
            HandlerState::Accepting(ref mut accepting) => accepting.poll(data),
            HandlerState::Done => panic!("polling Done"),
        }
    }
}

struct HandlerData {
    transport: Option<ProtobufTransport<TcpStream>>,
    router_handle: UnboundedSender<router::TableCommand>,
}

impl HandlerData {
    // TODO: this might not be the ideal solution ...
    fn conn_mut<'a>(&'a mut self) -> &'a mut ProtobufTransport<TcpStream> {
        match self.transport.as_mut() {
            Some(conn) => conn,
            None => panic!("Connection moved"),
        }
    }
}

pub struct ConnectionHandler {
    state: HandlerState,
    data: HandlerData,
}

impl ConnectionHandler {
    pub fn new(router_handle: UnboundedSender<router::TableCommand>,
               stream: TcpStream) -> Self
    {
        let transport = ProtobufTransport::new(stream);
        ConnectionHandler {
            state: HandlerState::Waiting(Waiting),
            data: HandlerData {
                transport: Some(transport),
                router_handle,
            }
        }
    }
}

impl Future for ConnectionHandler {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let data = &mut self.data;
        loop {
            match self.state.poll(data) {
                // TODO: handle this case gracefully
                Err(err) => panic!("error: {}", err),
                Ok(Async::NotReady) => return Ok(Async::NotReady),
                Ok(Async::Ready(state)) => {
                    match state {
                        HandlerState::Done => return Ok(Async::Ready(())),
                        new_state => self.state = new_state,
                    }
                }
            }
        }
    }
}