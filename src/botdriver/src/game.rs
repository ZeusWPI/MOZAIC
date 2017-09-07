use std::collections::HashMap;

pub trait Game {
    // returns game state and initial status
    fn init(player_ids: Vec<usize>) -> (Self, GameStatus);
    // process player input and execute a game turn
    fn step(&mut self, responses: &Vec<Response>) -> GameStatus;
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

// Reason why the game returned control.
#[derive(Debug)]
pub enum GameStatus {
    Finished(Outcome),
    Suspended(Vec<Prompt>)
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
