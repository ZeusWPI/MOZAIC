extern crate serde_json;

use rand;
use rand::Rng;

use game::*;
use std::collections::HashMap;

/// Protocol

// State passed to the players.
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
struct Response {
    answer: Answer,
}

#[derive(Serialize, Deserialize, PartialEq, Eq, Debug)]
#[serde(rename_all="SCREAMING_SNAKE_CASE")]
enum Answer {
    Higher,
    Lower,
}

impl Answer {
    fn get(reference: u64, number: u64) -> Answer {
        if number < reference {
            Answer::Lower
        } else {
            Answer::Higher
        }
    }
}



pub struct HigherLowerConfig {
    pub max: u64,                     // highest number that can be rolled
}

/// The gamestate for a higher-lower game.
pub struct HigherLower {
    players: Vec<PlayerId>,       // Players still in the game.
    eliminated: PlayerMap<u64>,   // The scoring for the eliminated players.
    number: u64,                  // Current number
    trial_num: u64,               // Current iteration (= score).
    max: u64                      // highest number that can be rolled
}

// Players can keep playing until they guess wrong.
// When they guess wrong, their score equals the trial number.
// The game goes on until all players are eliminated.
impl Game for HigherLower {
    type Config = HigherLowerConfig;
    type Outcome = PlayerMap<u64>;

    fn init(match_conf: &MatchConfig<Self>) -> (Self, GameStatus<Self>) {
        let state = HigherLower {
            eliminated: HashMap::new(),
            players: match_conf.players.keys().cloned().collect(),
            number: match_conf.game_config.max / 2,
            trial_num: 0,
            max: match_conf.game_config.max
        };
        let status = state.game_status();
        return (state, status);
    }

    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus<Self> {
        let answers = HigherLower::parse_answers(responses);
        let correct_answer = self.gen_next_number();

        for i in 0..self.players.len() {
            let player_id = self.players[i];
            match answers.get(&player_id) {
                Some(ans) if ans == &correct_answer => {},
                _ => self.eliminate_player(player_id),
            }
        }
        self.trial_num += 1;
        return self.game_status();
    }
}

impl HigherLower {
    fn game_status(&self) -> GameStatus<Self> {
        if self.players.len() > 0 {
            GameStatus::Finished(self.eliminated.clone())
        } else {
            GameStatus::Prompting(self.prompts())
        }
    }

    fn prompts(&self) -> PlayerMap<String> {
        self.players.iter().map(|&player_id| {
            let data = serde_json::to_string( &State {
                max: self.max,
                current: self.number,
            }).expect("[HIGHER_LOWER] Serializing game state failed.");
            return (player_id, data);
        }).collect()
    }

    fn gen_next_number(&mut self) -> Answer {
        let prev = self.number;
        self.number = rand::thread_rng().gen_range(0, self.max);
        return Answer::get(prev, self.number);
    }

    fn eliminate_player(&mut self, player_id: PlayerId) {
        self.players.retain(|p| p != &player_id);
        self.eliminated.insert(player_id, self.trial_num);
    }

    fn parse_answers(responses: &PlayerMap<String>) -> PlayerMap<Answer> {
        responses.iter().filter_map(|(&player_id, response)| {
            // ignore incorrectly formatted arguments
            serde_json::from_str(response).ok().map(|answer| (player_id, answer))
        }).collect()
    }
}
