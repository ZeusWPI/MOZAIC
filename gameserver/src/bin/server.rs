use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

extern crate sodiumoxide;
extern crate serde_json;
extern crate tokio;
extern crate mozaic;

// use mozaic::server::{Config as ServerConfig, Server};

use std::net::SocketAddr;
use tokio::prelude::Stream;
use mozaic::net::{StreamHandler, Writer, MsgHandler};
use mozaic::network_capnp::{connect};

// Load the config and start the game.
fn main() {
    run(env::args().collect());
}

struct ConnHandler {
}

impl ConnHandler {
    fn handle_connect(&mut self, w: &mut Writer, r: connect::Reader)
        -> Result<(), capnp::Error>
    {
        println!("got connect");
        return Ok(());
    }
}

pub fn run(args : Vec<String>) {
    let addr = "127.0.0.1:9142".parse::<SocketAddr>().unwrap();
    let listener = tokio::net::TcpListener::bind(&addr).unwrap();

    tokio::run(listener.incoming()
        .map_err(|e| eprintln!("failed to accept socket; error = {:?}", e))
        .for_each(|stream| {
            println!("got connection");
            let state = ConnHandler {};
            let mut h = mozaic::net::StreamHandler::new(state, stream);
            h.on(connect::Owned, MsgHandler::new(ConnHandler::handle_connect));
            h
        })
    );

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
