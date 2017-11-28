extern crate serde_json;

use rand;
use rand::Rng;

use game::*;
use logger::*;
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


/// Log
#[derive(Serialize)]
struct Turn<'g> {
    trial_num: u64,
    current: u64,
    next: u64,
    answers: &'g PlayerMap<Answer>,
}


pub struct HigherLowerConfig {
    pub max: u64,                     // highest number that can be rolled
}

/// The gamestate for a higher-lower game.
pub struct HigherLower {
    players: Vec<PlayerId>,         // Players still in the game.
    eliminated: PlayerMap<u64>,     // The scoring for the eliminated players.
    current: u64,                   // The current number
    next: u64,                      // The next number
    trial_num: u64,                 // Current iteration (= score).
    max: u64,                       // highest number that can be rolled
    logger: Logger,
}

// Players can keep playing until they guess wrong.
// When they guess wrong, their score equals the trial number.
// The game goes on until all players are eliminated.
impl Game for HigherLower {
    type Config = HigherLowerConfig;
    type Outcome = PlayerMap<u64>;

    fn init(match_params: MatchParams<Self>) -> (Self, GameStatus<Self>) {
        let state = HigherLower {
            eliminated: HashMap::new(),
            players: match_params.players.keys().cloned().collect(),
            current: 0,
            next: match_params.game_config.max / 2,
            trial_num: 0,
            max: match_params.game_config.max,
            logger: match_params.logger,
        };
        let status = state.game_status();
        return (state, status);
    }

    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus<Self> {
        let answers = HigherLower::parse_answers(responses);
        let correct_answer = self.gen_next_number();
        self.log_turn(&answers);


        let mut i = 0;
        while i < self.players.len() {
            match answers.get(&self.players[i]) {
                Some(ans) if ans == &correct_answer => {
                    i += 1;
                },
                _ => {
                    let removed = self.players.swap_remove(i);
                    self.eliminated.insert(removed, self.trial_num);
                }
            }
        }
        self.trial_num += 1;
        return self.game_status();
    }
}

impl HigherLower {
    fn game_status(&self) -> GameStatus<Self> {
        if self.players.is_empty() {
            GameStatus::Finished(self.eliminated.clone())
        } else {
            GameStatus::Prompting(self.prompts())
        }
    }

    fn prompts(&self) -> PlayerMap<String> {
        self.players.iter().map(|&player_id| {
            let data = serde_json::to_string( &State {
                max: self.max,
                current: self.current,
            }).expect("[HIGHER_LOWER] Serializing game state failed.");
            return (player_id, data);
        }).collect()
    }

    fn log_turn(&mut self, answers: &PlayerMap<Answer>) {
        self.logger.log_json(&Turn {
            answers: answers,
            trial_num: self.trial_num,
            current: self.current,
            next: self.next,
        }).unwrap();
    }

    fn gen_next_number(&mut self) -> Answer {
        self.current = self.next;
        self.next = rand::thread_rng().gen_range(0, self.max);
        return Answer::get(self.current, self.next);
    }

    fn parse_answers(responses: &PlayerMap<String>) -> PlayerMap<Answer> {
        responses.iter().filter_map(|(&player_id, response_text)| {
            // ignore incorrectly formatted arguments
            let response: Option<Response> = serde_json::from_str(response_text).ok();
            return response.map(|resp| (player_id, resp.answer));
        }).collect()
    }
}
