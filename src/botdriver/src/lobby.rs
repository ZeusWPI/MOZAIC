use bot_runner::*;

use std::error::Error;
use std::io::{Read};
use std::env::Args;
use std::path::Path;
use std::fs::File;
use std::process;

use serde_derive;
use serde_json;
use serde;

use planetwars;

#[derive(Serialize, Deserialize)]
pub struct PlayerContents {
    pub players: Vec<PlayerConfig>    
}

#[derive(Serialize, Deserialize)]
pub struct ConfigContents {
    pub game_config: planetwars::Config,
    pub log_file: Option<String>
}

pub fn parse_players(path: &Path) -> Result<PlayerContents, Box<Error>> {
    println!("Opening player config {}", path.to_str().unwrap());
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    println!("Parsing config");
    let config: PlayerContents = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(config)
}

pub fn parse_contents(path: &Path) -> Result<ConfigContents, Box<Error>> {
    println!("Opening player config {}", path.to_str().unwrap());
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    println!("Parsing config");
    let config: ConfigContents = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(config)
}



pub fn lobby_args(ext_args : &Vec<String>) -> i32
{
    let mut cl_vec = ext_args.clone();
    let mut args = cl_vec.iter(); 
    //set args at 3rd element (this sucks)
    args.next();
    args.next();

    //make a dictionary
    let mut bot_info = HashMap::new();

    let mut a = false;
    while let Some(s) = args.next(){
        if s == "--config" {
            a = true;
        }
        else if a {
            let match_description: ConfigContents = match parse_contents(Path::new(s)) {
                Ok(config) => config,
                Err(e) => {
                    println!("{}", e);
                    process::exit(1)
                }
            };

            // TODO check if players exist in dictionary: need to parse config
        }
        else {
            let playerlist: PlayerContents = match parse_players(Path::new(s)) {
                Ok(players) => players,
                Err(e) => {
                    println!("{}", e);
                    process::exit(1)
                }
            };
            //for player in playerlist {
            //    bot_info.insert(player.name, player);
            //}
            // add player to dictionary
        }
    }
    let mut retv = 0;
    if !a {
        println!("No config files given");
        retv = 1;
    }
    return retv;
}
