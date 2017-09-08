extern crate serde_json;

use rand;
use rand::Rng;

use game::*;

// Highest possible number that can be chosen.
const MAX: u64 = 500;

/// The gamestate for a higher-lower game.
///
/// It's rules are described by it's implementation for types::Game below.
/// TODO: Add rustdoc links
pub struct HigherLower {
    players: Vec<u64>,            // The players still in the game.
    eliminated: Vec<PlayerScore>, // The scoring for the eliminated players.
    max: u64,                     // Highest possible number that can be chosen.
    number: u64,                  // Current number
    score: usize                  // Current iteration (= score).
}

// The gamestate passed to the players.
#[derive(Serialize, Deserialize)]
struct State {
    max: u64,
    current: u64,
}

// The commands received from the players.
// Answer should be one of "HIGHER" or "LOWER".
// Response should thus be like this:
// {"answer":"HIGHER"}
#[derive(Serialize, Deserialize)]
struct Command {
    answer: String
}

impl HigherLower {
    fn status(&self) -> GameStatus {
        GameStatus {
            control_status: self.control_status(),
            // for now, don't log.
            // IT IS NOT IMPLEMENTED YET ANYWAYS!!!!1!
            log_entry: None,
        }
    }

    fn control_status(&self) -> ControlStatus {
        if self.players.is_empty() {
            ControlStatus::Finished(Outcome::Score(self.eliminated.clone()))
        } else {
            ControlStatus::Prompting(self.prompts())
        }
    }

    fn prompts(&self) -> Vec<Prompt> {
        self.players.iter().map(|&player_id| {
            let data = serde_json::to_string( &State {
                max: self.max,
                current: self.number,
            }).expect("[HIGHER_LOWER] Serializing game state failed.");
            return Prompt { player_id, data };
        }).collect()
    }

    fn gen_number(&mut self) -> &'static str {
        let prev = self.number;
        self.number = rand::thread_rng().gen_range(0, self.max);
        if self.number < prev {
            "LOWER"
        } else {
            "HIGHER"
        }
    }

    fn eliminate_player(&mut self, player_id: u64) {
        self.players.retain(|p| p != &player_id);
        self.eliminated.push(PlayerScore {player_id, score: self.score as f64});
    }
}

fn parse_command(response: &Response) -> Option<Command> {
    response.data.as_ref().and_then(|text| {
        serde_json::from_str(text).ok()
    })
}

// An implementation of higher-lower in the form of a types::Game.
// Players can keep playing until they guess wrong.
// When they guess wrong, their score equals the current iteration of the game.
// The game goes on until all players are eliminated.
// No negative numbers.
impl Game for HigherLower {
    type Config = ();

    fn init(config: (), players: Vec<u64>) -> (Self, GameStatus) {
        let mut state = HigherLower {
            eliminated: Vec::with_capacity(players.len()),
            players: players,
            max: MAX,
            number: 0, // This gets overridden in the next line.
            score: 0
        };
        state.gen_number();
        let status = state.status();
        return (state, status);
    }

    fn step(&mut self, responses: &Vec<Response>) -> GameStatus {
        let correct = self.gen_number();

        // TODO: please clean this up
        // Process all player answers.
        for response in responses {
            if let Some(c) = parse_command(response) {
                if c.answer != correct {
                    self.eliminate_player(response.player_id);
                }
            } else {
                // TODO: please. please.
                return GameStatus {
                    control_status: ControlStatus::Finished(
                        Outcome::Error(
                            "Didn't receive a valid command.".to_string()
                        )),
                    log_entry: None,
                };
            }
        }
        self.score += 1;
        return self.status();
    }
}
