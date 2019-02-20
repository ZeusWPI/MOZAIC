use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

extern crate sodiumoxide;
extern crate serde_json;
extern crate tokio;
extern crate futures;
extern crate mozaic;
extern crate rand;

// use mozaic::server::{Config as ServerConfig, Server};

use std::net::SocketAddr;
use tokio::prelude::Stream;
use tokio::runtime::Runtime;
use futures::sync::mpsc;
use mozaic::net::{StreamHandler, Writer, MsgHandler, Forwarder};
use mozaic::network_capnp::{connect, connected};
use mozaic::core_capnp::{initialize, actor_joined};
use mozaic::messaging::runtime::{Broker, BrokerHandle};
use mozaic::messaging::types::*;
use mozaic::messaging::reactor::*;

use rand::Rng;

// Load the config and start the game.
fn main() {
    run(env::args().collect());
}

struct ConnectionHandler {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,
    welcomer_id: Uuid,
}

impl ConnectionHandler {
    fn handle_connect(&mut self, w: &mut Writer, r: connect::Reader)
        -> Result<(), capnp::Error>
    {
        let connecting_id: Uuid = r.get_id()?.into();
        self.broker.register(connecting_id.clone(), self.tx.clone());

        self.broker.send_message(&self.welcomer_id, actor_joined::Owned, |b| {
            let mut joined: actor_joined::Builder = b.init_as();
            set_uuid(joined.reborrow().init_id(), &connecting_id);
        });

        w.write(connected::Owned, |b| {
            let mut connected: connected::Builder = b.init_as();
            set_uuid(connected.reborrow().init_id(), &self.welcomer_id);
        });
        return Ok(());
    }
}

struct Welcomer {
    runtime_id: Uuid,
}

impl Welcomer {
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
        let link = WelcomerRuntimeLink {};
        handle.open_link(link.params(self.runtime_id.clone()));
        return Ok(());
    }
}

struct WelcomerRuntimeLink {}

impl WelcomerRuntimeLink {
    fn params<C: Ctx>(self, foreign_uuid: Uuid) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_uuid, self);
        params.external_handler(
            actor_joined::Owned,
            CtxHandler::new(Self::welcome),
        );

        return params;
    }

    fn welcome<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        r: actor_joined::Reader,
    ) -> Result<(), capnp::Error>
    {
        let id: Uuid = r.get_id()?.into();
        println!("welcoming {:?}", id);
        return Ok(());
    }
}

pub fn run(_args : Vec<String>) {

    let addr = "127.0.0.1:9142".parse::<SocketAddr>().unwrap();
    let listener = tokio::net::TcpListener::bind(&addr).unwrap();
    let mut broker = Broker::new();

    tokio::run(futures::lazy(move || {
        let welcomer_id: Uuid = rand::thread_rng().gen();
        let welcomer = Welcomer {
            runtime_id: broker.get_runtime_id(),
        };

        broker.spawn(welcomer_id.clone(), welcomer.params());

        listener.incoming()
        .map_err(|e| eprintln!("failed to accept socket; error = {:?}", e))
        .for_each(move |stream| {
            println!("got connection");
            let (tx, rx) = mpsc::unbounded();

            let state = ConnectionHandler {
                broker: broker.clone(),
                welcomer_id: welcomer_id.clone(),
                tx,
            };
            let mut handler = mozaic::net::StreamHandler::new(state, stream);
            handler.on(connect::Owned,
                MsgHandler::new(ConnectionHandler::handle_connect));
            Forwarder { handler, rx }
        })
    }));

    // if args.len() != 2 {
    //     println!("Expected 1 argument (config file). {} given.", args.len() - 1);
    //     std::process::exit(1)
    // }

    // let config = match parse_config(Path::new(&args[1])) {
    //     Ok(config) => config,
    //     Err(e) => {
    //         println!("{}", e);
    //         std::process::exit(1)
    //     }
    // };

    // let server = Server::new(config);
    // tokio::run(server);
}


// Parse a config passed to the program as an command-line argument.
// Return the parsed config.

// fn parse_config(path: &Path)
//     -> Result<ServerConfig, Box<Error>>
// {
//     println!("Opening config {}", path.to_str().unwrap());
//     let mut file = File::open(path)?;

//     println!("Reading contents");
//     let mut contents = String::new();
//     file.read_to_string(&mut contents)?;

//     println!("Parsing config");
//     let config: ServerConfig = serde_json::from_str(&contents)?;

//     println!("Config parsed succesfully");
//     Ok(config)
// }
