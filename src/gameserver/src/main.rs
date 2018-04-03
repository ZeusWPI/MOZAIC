mod bot_runner;
mod client_controller;
mod planetwars;
mod protobuf_codec;
mod router;
mod tcp;

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
use std::sync::{Arc, Mutex};
use futures::sync::mpsc;
use futures::Stream;
use futures::Future;
use tokio::runtime::Runtime;

use client_controller::ClientController;
use planetwars::{Controller, Client};
use router::RoutingTable;

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

    let log_file = File::create("log.json").unwrap();

    let logger = slog::Logger::root( 
        Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
        o!()
    );

    let mut runtime = Runtime::new().unwrap();

    let routing_table = Arc::new(Mutex::new(RoutingTable::new()));

    let (controller_handle, controller_chan) = mpsc::unbounded();

    let handles = match_description.players.iter().enumerate().map(|(num, desc)| {
        let mut controller = ClientController::new(
            num,
            desc.token.clone(),
            routing_table.clone(),
            controller_handle.clone(),
            &logger);
        let ctrl_handle = controller.handle();
        controller.register();
        runtime.spawn(controller);

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
    runtime.spawn(controller);

    let addr = "127.0.0.1:9142".parse().unwrap();
    let listener = tcp::Listener::new(&addr, routing_table.clone()).unwrap();
    runtime.spawn(listener);

    runtime.shutdown_on_idle().wait().unwrap();
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