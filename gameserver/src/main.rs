mod bot_runner;
mod client_controller;
mod buffered_sender;
mod planetwars;

extern crate bytes;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
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

use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use slog::Drain;
use std::sync::Mutex;
use tokio_core::reactor::Core;
use futures::sync::mpsc;

use serde::de::DeserializeOwned;

use bot_runner::*;

use client_controller::ClientController;
use planetwars::modules::pw_controller::PwController;
use planetwars::modules::step_lock::StepLock;
use planetwars::{Controller, Client};
use planetwars::time_out::Timeout;
use planetwars::controller::PlayerId;

type SubController<G, C> = Controller<G, StepLock<G, C>, C>;
type FullController = SubController<PwController, planetwars::modules::Config>;
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

    let mut reactor = Core::new().unwrap();

    let log_file = File::create(match_description.log_file).unwrap();

    let logger = slog::Logger::root( 
        Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
        o!()
    );

    let mut bots = spawn_bots(&reactor.handle(), &match_description.players);

    let (handle, chan) = mpsc::unbounded();


    let handles = match_description.players.iter().enumerate().map(|(num, desc)| {
        let num = PlayerId::new(num);
        let bot_handle = bots.remove(&desc.name).unwrap();
        let controller = ClientController::new(
            num,
            desc.name.clone(),
            bot_handle,
            handle.clone(),
            &logger);
        let ctrl_handle = controller.handle();
        reactor.handle().spawn(controller);

        Client {
            id: num,
            player_name: desc.name.clone(),
            handle: ctrl_handle,
        }
    }).collect();

    let controller: FullController = Controller::new(
        handles,
        chan,
        match_description.game_config,
        Timeout::new(handle.clone(), reactor.handle().clone()),
        logger,
    );

    println!("starting loop");
    reactor.run(controller).unwrap();
}

#[serde(bound(deserialize = ""))]
#[derive(Serialize, Deserialize)]
pub struct MatchDescription<T: DeserializeOwned> {
    pub players: Vec<PlayerConfig>,
    pub log_file: String,
    pub game_config: T,
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