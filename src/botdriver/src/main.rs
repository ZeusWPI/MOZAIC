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

use game_types::{Game, GameInfo, GameStatus, PlayerInput, PlayerOutput, PlayerCommand, Outcome};
use driver_types::{BotHandles, BotHandle, GameConfig};
use higher_lower::HigherLower;

// Load the config and start the game.
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

/* 
 * Run a game with a specified config.
 * The algorithm for running a game goes as follows:
 *
 * ```
 * generate initial game
 * while (gamestate is not finnished) do
 *   gamestate = game.step()
 * 
 * finnish()
 * ```
 */
fn run<G: Game>(config: &GameConfig) {
    let players = config.players.keys().cloned().collect();
    let mut game = G::init(players);
    let mut gamestatus = game.start();
    let mut handles = util::create_bot_handles(config); 
    loop {
        println!("\nNew step:\n==============");
        gamestatus = match gamestatus {
            GameStatus::Running(pi) => step(&mut handles, &pi, &mut game),
            GameStatus::Done(outcome) => {
                finnish(&mut handles, outcome);
                break
            }
        }
    }
}

// Let the game play a step.
// Fetches all player responses to current state.
// Let's the game calculate next state.
// Return next state for next step (if game is not over yet).
fn step<G: Game>(mut bots: &mut BotHandles, player_input: &PlayerInput, game: &mut G) -> GameStatus {
    println!("Running with new player input:\n{:?}\n", player_input);
    let po = fetch_player_outputs(&player_input, &mut bots);
    match po {
        Ok(po) => {
            println!("Received new player output:\n{:?}\n", po);
            return game.step(&po);
        },
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    }
}

// Finnish up a game.
// Clean up any remaining botprocesses.
fn finnish(bots: &mut BotHandles, outcome: Outcome) {
    // Kill bot-processes
    for (player, bot) in bots.iter_mut() {
        bot.kill().expect(&format!("Unable to kill {}", player));
    }
    println!("Done with: {:?}", outcome);
}

// Fetch the responses from all players.
//
// TODO: Handle failure of fetching player response by propagating an empty response
//       This allows the gamerules to handle the problem.
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

// Fetch the response for a particular player.
// Do this by passing his information, and (blockingly) wait for a response.
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