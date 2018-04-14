#![allow(dead_code)]
mod client_controller;
mod connection;
mod planetwars;
mod protobuf_codec;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
}


extern crate bytes;
extern crate hex;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
extern crate tokio;
extern crate tokio_timer;
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
use std::time::{Duration, Instant};

use slog::Drain;
use std::sync::{Arc, Mutex};
use futures::sync::mpsc;
use futures::Future;
use tokio::runtime::Runtime;
use tokio::timer::Delay;

use serde::de::{Deserialize, Deserializer, DeserializeOwned};
use serde::de::Error as DeserializationError;

use client_controller::ClientController;
use planetwars::modules::pw_controller::PwController;
use planetwars::modules::step_lock::StepLock;
use planetwars::Client;
use connection::router::RoutingTable;
use planetwars::time_out::Timeout;
use planetwars::controller::PlayerId;

//type SubController<G, C> = Controller<G, StepLock<G, C>, C>;
//type FullController = SubController<PwController, planetwars::modules::Config>;
type FullMatchDescription = MatchDescription<planetwars::modules::Config>;

// Load the config and start the game.
fn main() {
    let args: Vec<_> = env::args().collect();
    if args.len() != 2 {
        println!("Expected 1 argument (config file). {} given.", args.len() - 1);
        std::process::exit(1)
    }

    let match_description: FullMatchDescription = match parse_config(Path::new(&args[1])) {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };

    let log_file = File::create(match_description.log_file).unwrap();

    let logger = slog::Logger::root( 
        Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
        o!()
    );

    let mut runtime = Runtime::new().unwrap();

    let routing_table = Arc::new(Mutex::new(RoutingTable::new()));

    let (controller_handle, controller_chan) = mpsc::unbounded();

    let clients = match_description.players.iter().enumerate().map(|(num, desc)| {
        let num = PlayerId::new(num);
        let controller = ClientController::new(
            num,
            desc.token.clone(),
            routing_table.clone(),
            controller_handle.clone());
        let ctrl_handle = controller.handle();
        runtime.spawn(controller);

        Client {
            id: num,
            player_name: desc.name.clone(),
            // TODO
            handle: ctrl_handle,
        }
    }).collect();

    let controller = PwController::new(
        match_description.game_config,
        clients,
        controller_chan,
        logger,
    );
    runtime.spawn(controller.and_then(|_| {
        println!("done");
        // wait a second for graceful exit
        let end = Instant::now() + Duration::from_secs(1);
        Delay::new(end).map_err(|e| panic!("delay errored; err={:?}", e))
    }).map(|_| {
        std::process::exit(0);
    }));

    let addr = "127.0.0.1:9142".parse().unwrap();
    let listener = connection::tcp::Listener::new(&addr, routing_table.clone()).unwrap();
    runtime.spawn(listener);

    runtime.shutdown_on_idle().wait().unwrap();
}

#[serde(bound(deserialize = ""))]
#[derive(Serialize, Deserialize)]
pub struct MatchDescription<T: DeserializeOwned> {
    pub players: Vec<PlayerConfig>,
    pub log_file: String,
    pub game_config: T,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    #[serde(deserialize_with="from_hex")]
    pub token: Vec<u8>,
}

fn from_hex<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where D: Deserializer<'de>
{
    let s: &str = try!(Deserialize::deserialize(deserializer));
    return hex::decode(s).map_err(D::Error::custom);
}


// Parse a config passed to the program as an command-line argument.
// Return the parsed config.
pub fn parse_config<C: DeserializeOwned>(path: &Path) -> Result<MatchDescription<C>, Box<Error>> {
    println!("Opening config {}", path.to_str().unwrap());
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    println!("Parsing config");
    let config: MatchDescription<C> = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(config)
}