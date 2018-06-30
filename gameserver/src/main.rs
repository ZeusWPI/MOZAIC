#![allow(dead_code)]
mod network;
mod oneshot_server;
mod planetwars;
mod protobuf_codec;
mod utils;
mod reactors;
mod events;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
    pub mod events {
        include!(concat!(env!("OUT_DIR"), "/mozaic.events.rs"));
    }
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

extern crate prost;
#[macro_use]
extern crate prost_derive;


use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use oneshot_server::{MatchDescription, OneshotServer};

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

    let server = OneshotServer::new(match_description);
    tokio::run(server);
}




// Parse a config passed to the program as an command-line argument.
// Return the parsed config.
pub fn parse_config(path: &Path)
    -> Result<MatchDescription, Box<Error>>
{
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