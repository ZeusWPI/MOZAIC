
use std::net::SocketAddr;

use rand::Rng;
use tokio::net::TcpStream;
use futures::Future;

use messaging::types::*;
use messaging::reactor::CoreParams;
use messaging::runtime::{Broker, BrokerHandle, Runtime};
use net::client::ClientHandler;


pub struct ClientParams {
    pub runtime_id: Uuid,
    pub greeter_id: Uuid,
}

pub fn run_client<F, S>(addr: SocketAddr, init: F)
    where F: Fn(ClientParams) -> CoreParams<S, Runtime> + 'static + Send + Sync,
          S: 'static + Send,
{
    let broker = Broker::new();

    let t = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(move |stream| {
            ClientHandler::new(stream, broker.clone(), move |greeter_id| {
                let runtime_id = broker.get_runtime_id();

                return init(ClientParams {
                    runtime_id,
                    greeter_id,
                });
            })
        });
    tokio::run(t);
}