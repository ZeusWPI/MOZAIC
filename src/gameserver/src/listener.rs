use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::UnboundedSender;
use prost::Message;
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};
use std::io;
use std::net::SocketAddr;

use connection_handler::ConnectionHandler;
use protobuf_codec::ProtobufTransport;
use protocol;
use router;

pub struct Listener {
    incoming: Incoming,
    router_handle: UnboundedSender<router::TableCommand>,
}

impl Listener {
    pub fn new(addr: &SocketAddr, router_handle: UnboundedSender<router::TableCommand>)
               -> io::Result<Self>
    {
        TcpListener::bind(addr).map(|tcp_listener| {
            Listener {
                router_handle,
                incoming: tcp_listener.incoming(),
            }
        })
    }

    fn handle_connections(&mut self) -> Poll<(), io::Error> {
        while let Some(raw_stream) = try_ready!(self.incoming.poll()) {
            let handler = ConnectionHandler::new(
                self.router_handle.clone(),
                raw_stream
            );
            tokio::spawn(handler);
        }
        return Ok(Async::Ready(()));
    }
}

impl Future for Listener {
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