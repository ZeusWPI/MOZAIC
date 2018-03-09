mod bot_runner;
mod client_controller;
mod protobuf_codec;
mod planetwars;
mod router;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
}


extern crate bytes;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio;
extern crate tokio_process;
#[macro_use]
extern crate futures;
extern crate fnv;

extern crate serde;
extern crate serde_json;
extern crate erased_serde;
#[macro_use]
extern crate error_chain;

#[macro_use]
extern crate serde_derive;


#[macro_use]
extern crate slog;
extern crate slog_json;

extern crate prost;
#[macro_use]
extern crate prost_derive;


use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use slog::Drain;
use std::sync::Mutex;
use tokio_core::reactor::Core;
use tokio::net::TcpListener;
use futures::sync::mpsc;
use futures::Stream;
use tokio_io::{AsyncRead, AsyncWrite};
use prost::Message;
use futures::Future;

use protobuf_codec::ProtobufTransport;

use client_controller::ClientController;
use planetwars::{Controller, Client};
use router::Router;

// Load the config and start the game.
fn main() {
    let args: Vec<_> = env::args().collect();
    if args.len() != 2 {
        println!("Expected 1 argument (config file). {} given.", args.len() - 1);
        std::process::exit(1)
    }

    let match_description: MatchDescription = match parse_config(Path::new(&args[1])) {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };

    let mut reactor = Core::new().unwrap();

    let log_file = File::create("log.json").unwrap();

    let logger = slog::Logger::root( 
        Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
        o!()
    );


    let (router_handle, router_chan) = mpsc::unbounded();
    let (controller_handle, controller_chan) = mpsc::unbounded();

    let handles = match_description.players.iter().enumerate().map(|(num, desc)| {
        let mut controller = ClientController::new(
            num,
            desc.token.clone(),
            router_handle.clone(),
            controller_handle.clone(),
            &logger);
        let ctrl_handle = controller.handle();
        controller.register();
        reactor.handle().spawn(controller);

        Client {
            id: num,
            player_name: desc.name.clone(),
            // TODO
            handle: ctrl_handle,
        }
    }).collect();


    let controller = Controller::new(
        handles,
        controller_chan,
        match_description.game_config,
        logger,
    );
    reactor.handle().spawn(controller);

    let router = Router::new(router_chan);
    reactor.handle().spawn(router);

    let addr = "127.0.0.1:9142".parse().unwrap();
    let listener = TcpListener::bind(&addr).unwrap();

    let server = listener.incoming().for_each(|socket| {
        println!("accepted socket; addr={:?}", socket.peer_addr().unwrap());
        let transport = ProtobufTransport::new(socket);
        let conn = transport.into_future()
            .map_err(|(e, _)| e)
            .and_then(|(item, _)| {
                let bytes = item.unwrap().freeze();
                let msg = try!(protocol::Connect::decode(bytes));
                println!("{:?}", msg);
                Ok(())
            });
        return conn;
    });


    reactor.run(server).unwrap();
}

#[derive(Serialize, Deserialize)]
pub struct MatchDescription {
    pub players: Vec<PlayerConfig>,
    pub game_config: planetwars::Config,
    pub log_file: Option<String>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    pub token: Vec<u8>,
}


// Parse a config passed to the program as an command-line argument.
// Return the parsed config.
pub fn parse_config(path: &Path) -> Result<MatchDescription, Box<Error>> {
    println!("Opening config {}", path.to_str().unwrap());
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    println!("Parsing config");
    let config: MatchDescription = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(config)
}