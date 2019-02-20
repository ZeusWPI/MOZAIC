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
use mozaic::core_capnp::{initialize, terminate_stream, send_greeting, greeting};
use mozaic::messaging::reactor::*;
use mozaic::messaging::types::{Uuid, Message, set_uuid};
use mozaic::messaging::runtime::{Broker, BrokerHandle};
use futures::sync::mpsc;
use rand::Rng;

struct ConnectionHandler {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,
    client_uuid: Uuid,
}

impl ConnectionHandler {
    fn handle_connected(&mut self, w: &mut Writer, r: connected::Reader)
        -> Result<(), capnp::Error>
    {
        let remote_uuid: Uuid = r.get_id()?.into();
        self.broker.register(remote_uuid.clone(), self.tx.clone());

        println!("connected to {:?}!", remote_uuid);
        let r = ClientReactor {
            remote_uuid,
        };
        self.broker.spawn(self.client_uuid.clone(), r.params());
        return Ok(());
    }
}


fn main() {
    let addr = "127.0.0.1:9142".parse().unwrap();
    let broker = Broker::new();

    let task = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(move |stream| {
            let client_uuid: Uuid = rand::thread_rng().gen();

            let (tx, rx) = mpsc::unbounded();
            let state = ConnectionHandler {
                broker: broker.clone(),
                client_uuid: client_uuid.clone(),
                tx,
            };

            let mut handler = mozaic::net::StreamHandler::new(state, stream);
            handler.on(connected::Owned,
                MsgHandler::new(ConnectionHandler::handle_connected));

            handler.writer().write(connect::Owned, |b| {
                let mut m: connect::Builder = b.init_as();
                set_uuid(m.reborrow().init_id(), &client_uuid);
            });
            Forwarder { handler, rx }
    });

    tokio::run(task);
}

struct ClientReactor {
    remote_uuid: Uuid,
}

impl ClientReactor {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, CtxHandler::new(Self::initialize));
        return params;
    }

    fn initialize<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        let link = (ServerLink {}).params(self.remote_uuid.clone());
        handle.open_link(link);

        handle.send_internal(send_greeting::Owned, |b| {
            let mut greeting: send_greeting::Builder = b.init_as();
            greeting.set_message("Hey friend!");
        });

        return Ok(());

    }
}

struct ServerLink {
}

impl ServerLink {
    fn params<C: Ctx>(self, foreign_uuid: Uuid) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_uuid, self);

        params.external_handler(
            terminate_stream::Owned,
            CtxHandler::new(Self::close_handler),
        );

        params.internal_handler(
            send_greeting::Owned,
            CtxHandler::new(Self::send_greeting),
        );
        return params;
    }

    fn send_greeting<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        send_greeting: send_greeting::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = send_greeting.get_message()?;

        handle.send_message(greeting::Owned, |b| {
            let mut greeting: greeting::Builder = b.init_as();
            greeting.set_message(message);
        });

        return Ok(());
    }




    fn close_handler<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        _: terminate_stream::Reader,
    ) -> Result<(), capnp::Error>
    {
        // also close our end of the stream
        handle.close_link();
        return Ok(());
    }

}