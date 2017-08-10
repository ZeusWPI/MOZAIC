mod game_types;
mod driver_types;
mod higher_lower;
mod util;

#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate serde;
extern crate rand;

use std::error::Error;
use std::io::{Write, BufReader, BufRead};

use game_types::{Game, GameInfo, GameStatus, PlayerInput, PlayerOutput, PlayerCommand};
use driver_types::{BotHandles, BotHandle, GameConfig};
use higher_lower::HigherLower;

fn main() {
    let game_config: GameConfig = match util::parse_config() {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };
    run::<HigherLower>(&game_config);
}

/* The algorithm for running a game goes as follows:
 *
 * ```
 * generate initial game
 * while (not finnished) do 
 *   for each player
 *     send gamestate to player
 *     receive new commands
 *   generate new gamestate
 * ```
 */
fn run<G: Game>(config: &GameConfig) {
    let mut game = G::init(config.players.keys().cloned().collect());
    let mut gamestate = game.start();
    let mut handles = util::create_bot_handles(config); 
    loop {
        println!("\nNew step:\n==============");
        match gamestate {
            GameStatus::Running(pi) => {
                println!("Running with new player input:\n{:?}\n", pi);
                let po = fetch_player_outputs(&pi, &mut handles);
                match po {
                    Ok(po) => {
                        println!("Received new player output:\n{:?}\n", po);
                        gamestate = game.step(&po);
                    },
                    Err(e) => {
                        println!("{}", e);
                        std::process::exit(1)
                    }
                }
            },
            GameStatus::Done(outcome) => {
                // Kill bot-processes
                for (player, bot) in handles.iter_mut() {
                    bot.kill().expect(&format!("Unable to kill {}", player));
                }
                println!("Done with: {:?}", outcome);
                break;
            } 
        }
    }
}

// TODO: This could be prettier i guess
fn fetch_player_outputs(input: &PlayerInput, bots: &mut BotHandles) -> Result<PlayerOutput, Box<Error>> {
    let mut pos = PlayerOutput::new();
    for (player, info) in input.iter() {
        let mut bot = bots.get_mut(player)
                          .expect(&format!("Response required for {} but no process found", player));
        let po = match fetch_player_output(info, bot) {
            Ok(po) => po,
            Err(e) => return Err(e)
        };
        pos.insert(player.clone(), po);
    }
    Ok(pos)
}

fn fetch_player_output(info: &GameInfo, bot: &mut BotHandle) -> Result<PlayerCommand, Box<Error>> {
    let msg_in = format!("Stdin not found for {:?}", bot);
    let msg_out = format!("Stdout not found for {:?}", bot);

    let bot_in = bot.stdin.as_mut().expect(&msg_in);
    let bot_out = bot.stdout.as_mut().expect(&msg_out);
    let mut bot_out = BufReader::new(bot_out);

    bot_in.write_fmt(format_args!("{}\n", info))?;
    bot_in.flush()?;
    
    // TODO: Set overflow limit
    let mut response = String::new();
    bot_out.read_line(&mut response).expect("Invalid UTF-8 found");

    Ok(response)
}