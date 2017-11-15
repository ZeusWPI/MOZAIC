#![feature(conservative_impl_trait)]

mod bot_runner;
mod planetwars;
mod lobby;

extern crate bytes;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
#[macro_use]
extern crate futures;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate serde;

use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use tokio_core::reactor::Core;
use futures::sync::mpsc;

use std::collections::HashMap;
use bot_runner::*;
use lobby::lobby_args;
use planetwars::{ClientController, Controller};

// Load the config and start the game.
fn main() {
    let args: Vec<_> = env::args().collect();
    if args.len() < 2 {
        let msg = format!("Expected at least 1 argument (config file). {} given.", args.len() - 1).to_owned();
        println!("{}", msg);
        std::process::exit(1)
    }

    if &args[1]== "--lobby" {
        let x = lobby_args(&args);
        std::process::exit(x);
    }

    let match_description: MatchDescription = match parse_config(Path::new(&args[1])) {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };

    let mut reactor = Core::new().unwrap();

    let player_names: HashMap<usize, String> = match_description.players
        .iter()
        .enumerate()
        .map(|(num, config)| {
            (num, config.name.clone())
        }).collect();
    
    let mut bots = spawn_bots(&reactor.handle(), &match_description.players);

    let (handle, chan) = mpsc::unbounded();

    let handles = player_names.iter().map(|(&id, name)| {
        let bot_handle = bots.remove(name).unwrap();
        let controller = ClientController::new(id, bot_handle, handle.clone());
        let ctrl_handle = controller.handle();
        reactor.handle().spawn(controller);
        return (id, ctrl_handle);
    }).collect();

    let controller = Controller::new(
        handles,
        player_names,
        chan,
        match_description.game_config
    ); 
    
    reactor.run(controller).unwrap();
}

#[derive(Serialize, Deserialize)]
pub struct MatchDescription {
    pub players: Vec<PlayerConfig>,
    pub game_config: planetwars::Config,
    pub log_file: Option<String>
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
