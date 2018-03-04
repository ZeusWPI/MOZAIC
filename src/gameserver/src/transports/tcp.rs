use bytes::BytesMut;
use futures::{Future, Poll, Async, Stream};
use futures::sink::{Sink, Send};
use futures::sync::mpsc::UnboundedReceiver;
use prost::Message;
use std::io;
use std::io::{Error, ErrorKind};
use std::mem;
use tokio::net::TcpStream;

use protocol;

use router::{Packet, RouterHandle};

use super::types::TransportCommand;
use super::protobuf_codec::ProtobufTransport;


enum SinkState<S: Sink> {
    Closed,
    Sending(Send<S>),
    Ready(S),
}

impl<S> SinkState<S>
    where S: Stream + Sink,
          io::Error: From<S::SinkError> + From<S::Error>
{
    fn poll_send(&mut self) -> Poll<S, Error> {
        let mut state = mem::replace(self, SinkState::Closed);

        if let SinkState::Sending(mut send) = state {
            state = match try!(send.poll()) {
                Async::Ready(sink) => SinkState::Ready(sink),
                Async::NotReady => SinkState::Sending(send),
            };
        }

        match state {
            SinkState::Closed => bail!(ErrorKind::NotConnected),
            SinkState::Ready(sink) => Ok(Async::Ready(sink)),
            SinkState::Sending(send) => {
                *self = SinkState::Sending(send);
                return Ok(Async::NotReady);
            }
        }
    }

    fn inner_mut<'a>(&'a mut self) -> io::Result<&'a mut S> {
        match self {
            &mut SinkState::Closed => bail!(ErrorKind::NotConnected),
            &mut SinkState::Ready(ref mut t) => Ok(t),
            &mut SinkState::Sending(ref mut send) => Ok(send.get_mut()),
        }
    }

    fn poll_recv(&mut self) -> Poll<S::Item, Error> {
        let inner = try!(self.inner_mut());
        match try_ready!(inner.poll()) {
            Some(item) => Ok(Async::Ready(item)),
            None => bail!(ErrorKind::ConnectionAborted),
        }
    }
}


type T = ProtobufTransport<TcpStream>;

pub struct TcpTransport {
    transport_id: u64,
    ctrl_chan: UnboundedReceiver<TransportCommand>,
    router_handle: RouterHandle,
    inner: SinkState<T>,
}

impl TcpTransport {
    fn poll_ctrl_chan(&mut self) -> Poll<TransportCommand, Error> {
        match self.ctrl_chan.poll().unwrap() {
            Async::Ready(Some(cmd)) => Ok(Async::Ready(cmd)),
            Async::Ready(None) => bail!(ErrorKind::ConnectionAborted),
            Async::NotReady => Ok(Async::NotReady),
        }
    }

    fn recv_commands(&mut self) -> Poll<(), Error> {
        loop {
            let sink = try_ready!(self.inner.poll_send());
            let cmd = match try!(self.poll_ctrl_chan()) {
                Async::Ready(command) => command,
                Async::NotReady => {
                    self.inner = SinkState::Ready(sink);
                    return Ok(Async::NotReady);
                },
            };

            match cmd {
                TransportCommand::Send(packet) => {
                    let proto_packet = protocol::Packet {
                        connection_id: packet.connection_id,
                        data: packet.data,
                    };
                    let size = proto_packet.encoded_len();
                    let mut buf = BytesMut::with_capacity(size);
                    proto_packet.encode(&mut buf);
                    self.inner = SinkState::Sending(sink.send(buf));
                }
            }
        }
    }

    fn recv_data(&mut self) -> Poll<(), Error> {
        loop {
            let bytes = try_ready!(self.inner.poll_recv());
            let proto_packet = try!(protocol::Packet::decode(bytes.freeze()));
            self.router_handle.receive(Packet {
                transport_id: self.transport_id,
                connection_id: proto_packet.connection_id,
                data: proto_packet.data,
            });
        }
    }

    fn try_poll(&mut self) -> io::Result<()> {
        try!(self.recv_commands());
        try!(self.recv_data());
        return Ok(());
    }
}

impl Future for TcpTransport {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.try_poll() {
            Ok(()) => Ok(Async::NotReady),
            Err(_) => Ok(Async::Ready(())),
        }
    }
}