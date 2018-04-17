#![allow(dead_code)]
mod network;
mod oneshot_server;
mod planetwars;
mod players;
mod protobuf_codec;
mod utils;

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

use serde::de::DeserializeOwned;

use oneshot_server::{MatchDescription, OneshotServer};

type FullMatchDescription = MatchDescription<planetwars::Config>;

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

    let server = OneshotServer::new(match_description);
    tokio::run(server);
}




// Parse a config passed to the program as an command-line argument.
// Return the parsed config.
pub fn parse_config<C: DeserializeOwned>(path: &Path)
    -> Result<MatchDescription<C>, Box<Error>>
{
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