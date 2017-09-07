use std::collections::HashMap;

// TODO: remove start.
pub trait Game {
    fn init(player_ids: Vec<usize>) -> Self;
    fn start(&mut self) -> GameStatus;
    fn step(&mut self, player_output: &Vec<Response>) -> GameStatus;
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
