mod types;
mod higher_lower;

extern crate serde;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate rand;

use types::*;
use std::error::Error;
use std::env;
use std::fs::File;
use std::io::prelude::*;
use std::path::PathBuf;

use higher_lower::HigherLower;

fn main() {
    let game_config: GameConfig = match parse_config() {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };
    run::<HigherLower>(&game_config);
}

fn parse_config() -> Result<GameConfig, Box<Error>> {
    let args: Vec<_> = env::args().collect();
    if (args.len() < 2) || (args.len() > 2) {
        let msg = format!("Expected 1 argument (config file). {} given.", args.len() - 1).to_owned();
        return Err(From::from(msg))
    }
    
    println!("Opening config {}", &args[1]);
    let path = PathBuf::from(&args[1]);
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    println!("Parsing config");
    let gc: GameConfig = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(gc)
}

/* generate initial game
     * While (not finnished) do 
        for each player
            send gamestate to player
            receive new commands
            generate new gamestate
     */
fn run<G: Game>(config: &GameConfig) {
    let player_list = config.players.iter().map(
        |ref pc| pc.name.clone()
    ).collect();

    let mut game = G::init(player_list);
    let mut gamestate = game.start();
    loop {
        println!("\nNew step:\n==============");
        match gamestate {
            GameStatus::Running(pi) => {
                println!("Running with new player input:\n{:?}\n", pi);
                let po = fetch_player_outputs(&pi);
                println!("Received new player output:\n{:?}\n", po);
                gamestate = game.step(&po);
            },
            GameStatus::Done(outcome) => {
                println!("Done with: {:?}", outcome);
                break;
            } 
        }
    }
}

// TODO: This could be prettier i guess
fn fetch_player_outputs(input: &PlayerInput) -> PlayerOutput {
    let mut po = vec![];
    for &(ref player, ref info) in input {
        po.push((player.clone(), fetch_player_output(player, info)))
    }
    po
}

fn fetch_player_output(player: &Player, info: &GameInfo) -> PlayerCommand {
    return r#"{"answer":"HIGHER"}"#.to_owned()
}