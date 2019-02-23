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
use mozaic::network_capnp::{connect, connected};
use mozaic::core_capnp::{initialize, terminate_stream, send_greeting, greeting};
use mozaic::messaging::reactor::*;
use mozaic::messaging::types::{Uuid, Message, set_uuid};
use mozaic::messaging::runtime::{Broker, BrokerHandle};
use futures::sync::mpsc;
use rand::Rng;


fn main() {
    let addr = "127.0.0.1:9142".parse().unwrap();
    let broker = Broker::new();

    let task = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(move |stream| {
            println!("connected");
            mozaic::net::client::ClientHandler::new(
                stream,
                broker.clone(),
                |remote_uuid| {
                    let r = ClientReactor { remote_uuid };
                    return r.params();
                }
            )
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