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

// Load the config and start the game.
fn main() {
    run(env::args().collect());
}

pub fn run(args : Vec<String>) {
    sodiumoxide::init().expect("failed to initialize libsodium");
    mozaic::messaging::test::run();
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
