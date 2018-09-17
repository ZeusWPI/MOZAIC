#![allow(dead_code)]
mod network;
mod planetwars;
mod utils;
mod reactors;
mod server;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
}

pub mod events {
    include!(concat!(env!("OUT_DIR"), "/mozaic.events.rs"));
}


extern crate bytes;
extern crate hex;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
extern crate tokio;
extern crate tokio_timer;
extern crate tokio_codec;
#[macro_use]
extern crate futures;
extern crate rand;

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
#[macro_use]
extern crate mozaic_derive;
extern crate sodiumoxide;


use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use server::{Config as ServerConfig, Server};

// Load the config and start the game.
fn main() {
    run(env::args().collect());
}

pub fn run(args : Vec<String>) {
    sodiumoxide::init().expect("failed to initialize libsodium");
    if args.len() != 2 {
        println!("Expected 1 argument (config file). {} given.", args.len() - 1);
        std::process::exit(1)
    }

    let config = match parse_config(Path::new(&args[1])) {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };

    let server = Server::new(config);
    tokio::run(server);
}


// Parse a config passed to the program as an command-line argument.
// Return the parsed config.
fn parse_config(path: &Path)
    -> Result<ServerConfig, Box<Error>>
{
    println!("Opening config {}", path.to_str().unwrap());
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    println!("Parsing config");
    let config: ServerConfig = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(config)
}
