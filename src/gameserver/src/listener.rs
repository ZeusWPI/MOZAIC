use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::UnboundedSender;
use prost::Message;
use tokio;
use tokio::net::{Incoming, TcpListener, TcpStream};
use std::io;
use std::net::SocketAddr;

use protobuf_codec::ProtobufTransport;
use protocol;
use router::RouterCommand;

pub struct Listener {
    incoming: Incoming,
    router_handle: UnboundedSender<RouterCommand>,
}

impl Listener {
    pub fn new(addr: &SocketAddr, router_handle: UnboundedSender<RouterCommand>)
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
            let stream = ProtobufTransport::new(raw_stream);
            let router_handle = self.router_handle.clone();
            let process = stream.into_future()
                .map_err(|(e, _)| e)
                .and_then(move |(item, stream)| {
                    let bytes = item.unwrap().freeze();
                    let request = try!(protocol::ConnectRequest::decode(bytes));
                    println!("got {:?}", request);
                    router_handle.unbounded_send(RouterCommand::Connect {
                        token: request.token,
                        stream: stream,
                    }).expect("router handle broke");
                    return Ok(());
                })
                // TODO: gracefully handle this
                .map_err(|e| panic!("error: {}", e));
            tokio::spawn(process);
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