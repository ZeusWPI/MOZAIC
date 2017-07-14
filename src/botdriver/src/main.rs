mod types;
mod higher_lower;

extern crate serde;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;

use types::*;
use std::error::Error;
use std::env;
use std::io;
use std::fs::File;
use std::io::prelude::*;
use std::path::PathBuf;

use higher_lower::HigherLower;

fn main() {
    let game_config = match parse_config() {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };
    run::<HigherLower>();
}

fn parse_config() -> Result<GameConfig, Box<Error>> {
    let args: Vec<_> = env::args().collect();
    if (args.len() < 2) || (args.len() > 2) {
        let msg = format!("Expected 1 argument (config file). {} given.", args.len() - 1).to_owned();
        return Err(From::from(msg))
    }
    
    println!("Opening config {}", &args[1]);
    let mut path = PathBuf::from(&args[1]);
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    println!("Parsing config");
    let gc: GameConfig = serde_json::from_str(&contents)?;

    println!("Config parsed succesfully");
    Ok(gc)
}

fn run<G: Game>() {
    /* generate initial game
     * While (not finnished) do 
        for each player
            send gamestate to player
            receive new commands
            generate new gamestate
     */
    let mut game = G::init(vec!["Ilion".to_owned()]);
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
    return match (player.as_ref(), info.as_ref()) {
        ("Ilion", "start") => "eerste zet".to_owned(),
        ("Anna", "betere start") => "betere eerste zet".to_owned(),
        ("Ilion", "slecht nieuws") => "paniek".to_owned(),
        ("Anna", "goed nieuws") => "de doodssteek".to_owned(),
        _ => "een beweging".to_owned()
    }
}