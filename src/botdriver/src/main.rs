mod game;
mod bot_runner;
mod games;
mod match_runner;
mod logger;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate serde;
use std::error::Error;
use std::io::{Read};
use std::env;
use std::path::Path;
use std::fs::File;

use game::*;
use bot_runner::*;
use match_runner::*;
use logger::Logger;

use games::planetwars;

// Load the config and start the game.
fn main() {
    let args: Vec<_> = env::args().collect();
    if args.len() != 2 {
        let msg = format!("Expected 1 argument (config file). {} given.", args.len() - 1).to_owned();
        println!("{}", msg);
        std::process::exit(1)
    }

    let match_description: MatchDescription = match parse_config(Path::new(&args[1])) {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };
    let players: PlayerMap<PlayerConfig> = match_description.players
        .into_iter()
        .enumerate()
        .collect();

    let player_names = players.iter().map(|(&num, config)| {
        let info = PlayerInfo { name: config.name.clone() };
        (num, info)
    }).collect();

    let mut bots = BotRunner::run(&players);

    {
        let log_file = match_description.log_file.unwrap_or("log.json".to_owned());
        let config = MatchParams {
            players: player_names,
            game_config: match_description.game_config,
            logger: Logger::new(&log_file),
        };
        
        
        let mut runner = MatchRunner {
            players: bots.player_handles(),
        };
        let outcome = runner.run::<planetwars::PlanetWars>(config);
        println!("Outcome: {:?}", outcome);
    }

    bots.kill();
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
