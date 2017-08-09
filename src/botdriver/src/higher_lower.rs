extern crate serde_json;

use rand;
use rand::Rng;

use types::{Game, GameStatus, Player, PlayerInput, PlayerOutput, Outcome, Scoring};

// Highest possible number that can be chosen.
const MAX: u32 = 500;

/// The gamestate for a higher-lower game.
///
/// It's rules are described by it's implementation for types::Game below.
/// TODO: Add rustdoc links
pub struct HigherLower {
    players: Vec<Player>,   // The players still in the game.
    eliminated: Scoring,    // The scoring for the eliminated players.
    max: u32,               // Highest possible number that can be chosen.
    last: u32,              // The value that was generated in the previous iteration.
    score: i32              // Current iteration (= score). Signed to match types::Score.
}

// The gamestate passed to the players.
#[derive(Serialize, Deserialize)]
struct State {
    max: u32,
    current: u32
}

// The commands received from the players.
// Answer should be one of "HIGHER" or "LOWER".
// Response should thus be like this:
// {"answer":"HIGHER"}
#[derive(Serialize, Deserialize)]
struct Command {
    answer: String
}

// An implementation of higher-lower in the form of a types::Game.
// Players can keep playing until they guess wrong.
// When they guess wrong, their score equals the current iteration of the game.
// The game goes on until all players are eliminated.
// No negative numbers.
impl Game for HigherLower {
    fn init(names: Vec<Player>) -> Self {
        HigherLower { 
            players: names,
            eliminated: Scoring::new(),
            max: MAX,
            last: 0, // This is always overridden when the game starts.
            score: 0
        }
    }

    fn start(&mut self) -> GameStatus {
        let mut stati: PlayerInput = PlayerInput::new();
        let value = rand::thread_rng().gen_range(0, self.max);

        // Generate the status for every player (all stati should be equal).
        for player in &self.players {
            let state = serde_json::to_string( &State { 
                max: self.max,
                current: value
            }).expect("[HIGHER_LOWER] Serializing game state failed.");
            stati.insert(player.clone(), state);
        }
        self.last = value;
        GameStatus::Running(stati)
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        let mut pi: PlayerInput = PlayerInput::new();
        let value = rand::thread_rng().gen_range(0, MAX);
        let n_state = serde_json::to_string( &State {
            max: self.max,
            current: value
        }).expect("Serializing game state failed");

        // Calculate the correct answer.
        let correct = match value {
            value if value > self.last => "HIGHER",
            value if value < self.last => "LOWER",
            _ => "LOWER" // TODO: Fix same number
        };

        // Process all player answers.
        for (player, command) in player_output.iter() {

            // Parse player command.
            let c: Command = match serde_json::from_str(command) {
                Ok(command) => command,
                // TODO: More expressive error
                Err(err) => {
                    let msg = format!("Invalid formatted command.\n{}", err);
                    return GameStatus::Done(Outcome::Error(msg.to_owned()));
                } 
            };
            let answer = c.answer;

            // Update new PlayerInput and/or gamestate.
            match answer {
                ref ans if ans == correct => {
                    pi.insert(player.clone(), n_state.clone());
                },
                _ => {
                    self.eliminated.insert(player.clone(), self.score);
                    self.players.retain(|p| p != player); // Remove faulty player
                } 
            }
        }
        
        // Game is done.
        if self.players.is_empty() {
            GameStatus::Done(Outcome::Score(self.eliminated.clone()))

        // Game is not done.
        } else {
            self.score += 1;
            self.last = value;
            GameStatus::Running(pi)
        }
    }
}