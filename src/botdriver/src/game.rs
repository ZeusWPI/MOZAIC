use std::collections::HashMap;

pub trait Game {
    type Config;

    // returns game state and initial status
    fn init(config: Config, player_ids: Vec<usize>) -> (Self, GameOutput);
    // process player input and execute a game turn
    fn step(&mut self, responses: &Vec<Response>) -> GameOutput;
}

#[derive(Debug)]
pub struct GameOutput {
    pub status: GameStatus,
    pub log_entry: Option<String>,
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus {
    Finished(Outcome),
    Suspended(Vec<Prompt>)
}

#[derive(Debug)]
pub struct Prompt {
    pub player_id: usize,
    pub data: String,
}

#[derive(Debug)]
pub struct Response {
    pub player_id: usize,
    pub data: String,
}
// TODO Improve error type. error-chain maybe?
#[derive(Debug)]
pub enum Outcome {
    Score(Vec<PlayerScore>),
    Error(String),
}

pub struct PlayerScore {
    pub player_id: usize,
    pub score: f64,
}
