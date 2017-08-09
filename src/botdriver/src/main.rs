mod types;
mod higher_lower;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate serde;
extern crate rand;

use types::*;
use std::error::Error;
use std::env;
use std::fs::File;
use std::process::{Command, Stdio, Child};
use std::io::{Write, Read, BufReader, BufRead};
use std::path::PathBuf;
use std::collections::HashMap;

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
    let gcf: GameConfigFormat = serde_json::from_str(&contents)?;
    let mut gc: GameConfig = GameConfig { players: HashMap::new() };
    
    // Move into easier to use struct
    // TODO, make oneliner
    for pc in gcf.players { 
        gc.players.insert(pc.name.clone(), pc);
    }
    println!("Config parsed succesfully");

    Ok(gc)
}

/* The algorithm for running a game goes as follows:
 *
 * ```
 * generate initial game
 * While (not finnished) do 
 *   for each player
 *     send gamestate to player
 *     receive new commands
 *   generate new gamestate
 * ```
 */
fn run<G: Game>(config: &GameConfig) {
    let mut game = G::init(config.players.keys().cloned().collect());
    let mut gamestate = game.start();
    let mut handles = create_bot_handles(config);
    loop {
        println!("\nNew step:\n==============");
        match gamestate {
            GameStatus::Running(pi) => {
                println!("Running with new player input:\n{:?}\n", pi);
                let po = fetch_player_outputs(&config, &pi, &mut handles);
                println!("Received new player output:\n{:?}\n", po);
                gamestate = game.step(&po);
            },
            GameStatus::Done(outcome) => {
                handles.values_mut().map(|bot| bot.kill());
                println!("Done with: {:?}", outcome);
                break;
            } 
        }
    }
}

fn create_bot_handles(config: &GameConfig) -> BotHandles {
    let mut children = BotHandles::new();

    for (player, pconfig) in config.players.iter() {
        let ref cmd = pconfig.start_command;
        let bot = Command::new("bash")
            .arg("-c")
            .arg(format!("{} {}", cmd, player))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("MOZAIC: Failed to execute process");

        children.insert(player.clone(), bot);
    }

    children
}

// TODO: This could be prettier i guess
fn fetch_player_outputs(config: &GameConfig, input: &PlayerInput, bots: &mut BotHandles) -> PlayerOutput {
    let mut po = PlayerOutput::new();
    for (player, info) in input.iter() {
        let mut bot = bots.get_mut(player).unwrap();
        po.insert(player.clone(), fetch_player_output(player, info, bot));
    }
    po
}

fn fetch_player_output(player: &Player, info: &GameInfo, bot: &mut BotHandle) -> PlayerCommand {
    let bot_in = bot.stdin.as_mut().unwrap();
    let mut bot_out = BufReader::new(bot.stdout.as_mut().unwrap());

    bot_in.write_fmt(format_args!("{}\n", info));
    bot_in.flush();
    let mut response = String::new();
    bot_out.read_line(&mut response).unwrap();

    response
}