extern crate mozaic;
extern crate sodiumoxide;
extern crate hex;
extern crate tokio;
extern crate futures;
extern crate prost;
extern crate rand;

use futures::Future;


use std::net::SocketAddr;
use tokio::prelude::Stream;
use tokio::net::TcpStream;
use mozaic::net::{StreamHandler, Writer, MsgHandler, Forwarder};
use mozaic::network_capnp::{connect, connected};
use mozaic::messaging::types::{Uuid, Message, set_uuid};
use mozaic::messaging::runtime::{Broker, BrokerHandle};
use futures::sync::mpsc;
use rand::Rng;

struct ConnectionHandler {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,
}

impl ConnectionHandler {
    fn handle_connected(&mut self, w: &mut Writer, r: connected::Reader)
        -> Result<(), capnp::Error>

    {
        let uuid: Uuid = r.get_id()?.into();
        self.broker.register(uuid.clone(), self.tx.clone());

        println!("connected to {:?}!", uuid);
        return Ok(());
    }
}


fn main() {
    let addr = "127.0.0.1:9142".parse().unwrap();
    let broker = Broker::new();

    let task = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(move |stream| {
            let (tx, rx) = mpsc::unbounded();
            let state = ConnectionHandler {
                broker: broker.clone(),
                tx,
            };

            let mut handler = mozaic::net::StreamHandler::new(state, stream);
            handler.on(connected::Owned,
                MsgHandler::new(ConnectionHandler::handle_connected));

            handler.writer().write(connect::Owned, |b| {
                let mut m: connect::Builder = b.init_as();
                let uuid: Uuid = rand::thread_rng().gen();
                set_uuid(m.reborrow().init_id(), &uuid);
            });
            Forwarder { handler, rx }
    });

    tokio::run(task);
}