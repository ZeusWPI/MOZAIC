use std::net::SocketAddr;
use std::io;

use futures::{Future, Poll, Async};
use tokio::net::TcpListener;
use rand::Rng;

use messaging::types::*;
use messaging::reactor::CoreParams;
use messaging::runtime::{Broker, BrokerHandle, Runtime};

use net::server::ServerHandler;

pub fn run_server<F, S>(addr: SocketAddr, initialize_greeter: F)
    where F: FnOnce(ReactorId) -> CoreParams<S, Runtime>,
          S: Send + 'static
{
    let mut broker = Broker::new();
    let greeter_id: ReactorId = rand::thread_rng().gen();
    let greeter_params = initialize_greeter(broker.get_runtime_id());

    tokio::run(futures::lazy(move || {
        broker.spawn(greeter_id.clone(), greeter_params);
        tokio::spawn(TcpServer::new(broker, greeter_id, &addr));
        return Ok(());
    }));
}

pub struct TcpServer {
    listener: TcpListener,
    broker: BrokerHandle,
    runtime_id: ReactorId,
    greeter_id: ReactorId,
}


impl TcpServer {
    pub fn new(broker: BrokerHandle, greeter_id: ReactorId, addr: &SocketAddr)
        -> Self
    {
        let listener = TcpListener::bind(addr).unwrap();

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