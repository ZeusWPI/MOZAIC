use match_runner::PlayerConfig;
use std::collections::HashMap;

pub trait Game : Sized {
    // returns game state and initial status
    fn init(players: &PlayerMap<PlayerConfig>) -> (Self, GameStatus)
        where Self: Sized;
    // process player input and execute a game turn
    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus;
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus {
    // map players to the prompt they should reply to
    Prompting(PlayerMap<String>),
    // map players to their score
    Finished(PlayerMap<f64>),
}

// TODO: might be better to put this elsewhere
pub type PlayerId = u64;
// Maps a player to something.
// TODO: non-cryptographic hash function maybe
pub type PlayerMap<T> = HashMap<PlayerId, T>;
