use std::net::SocketAddr;
use std::io;

use futures::{Future, Poll, Async};
use tokio::net::TcpListener;
use rand::Rng;

use messaging::types::*;
use messaging::reactor::CoreParams;
use messaging::runtime::{BrokerHandle, Runtime};

use net::server::ServerHandler;

pub struct TcpServer {
    listener: TcpListener,
    broker: BrokerHandle,
    runtime_id: Uuid,
    greeter_id: Uuid,
}


impl TcpServer {
    pub fn new(broker: BrokerHandle, addr: &SocketAddr) -> Self {
        let listener = TcpListener::bind(addr).unwrap();

        let greeter_id: Uuid = rand::thread_rng().gen();

        return TcpServer {
            listener,
            runtime_id: broker.get_runtime_id(),
            broker,
            greeter_id,
        };
    }

    fn handle_incoming(&mut self) -> Poll<(), io::Error> {
        loop {
            let (stream, _addr) = try_ready!(self.listener.poll_accept());
            let handler = ServerHandler::new(
                stream,
                self.broker.clone(),
                self.greeter_id.clone()
            );
            tokio::spawn(handler);
        }
    }
}

impl Future for TcpServer {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        Ok(self.handle_incoming().expect("failed to accept connection"))
    }
}