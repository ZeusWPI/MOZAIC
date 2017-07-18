use types::*;
use serde_json;
use rand;
use rand::Rng;

const MAX: u32 = 500;

pub struct HigherLower {
    players: Vec<Player>,
    eliminated: Scoring,
    max: u32,
    last: u32,
    score: i32 // i instead of u to match with Score
}

#[derive(Serialize, Deserialize)]
struct State {
    max: u32,
    current: u32
}

#[derive(Serialize, Deserialize)]
struct Command {
    answer: String
}

impl Game for HigherLower {
    fn init(names: Vec<Player>) -> Self {
        HigherLower { 
            players: names,
            eliminated: Scoring::new(),
            max: MAX,
            last: 0, // Is always overridden at start
            score: 0
        }
    }

    fn start(&mut self) -> GameStatus {
        let mut stati: PlayerInput = PlayerInput::new();
        let value = rand::thread_rng().gen_range(0, self.max);
        for player in &self.players {
            let state = serde_json::to_string( &State { 
                max: self.max,
                current: value
            }).expect("Serializing game state failed");
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

        let correct = match value {
            value if value > self.last => "HIGHER",
            value if value < self.last => "LOWER",
            _ => "LOWER" // Fix same number
        };
        println!("{}", correct);
        for (player, command) in player_output.iter() {
            let c: Command = match serde_json::from_str(command) {
                Ok(command) => command,
                // TODO More expressive error
                Err(err) => {
                    let msg = format!("Invalid formatted command.\n{}", err);
                    return GameStatus::Done(Outcome::Error(msg.to_owned()));
                } 
            };
            let answer = c.answer;

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
        
        if self.players.is_empty() {
            GameStatus::Done(Outcome::Score(self.eliminated.clone()))
        } else {
            self.score += 1;
            self.last = value;
            GameStatus::Running(pi)
        }
    }
}