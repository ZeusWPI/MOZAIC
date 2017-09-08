use match_runner::PlayerConfig;
use std::collections::HashMap;

pub trait Game : Sized {
    type State: GameState<Self>;
    type Outcome;
}

pub trait GameState<G: Game> : Sized {
    // returns game state and initial status
    fn init(players: &PlayerMap<PlayerConfig>) -> (Self, GameStatus<G>);
    // process player input and execute a game turn
    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus<G>;
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus<G> where G: Game {
    // map players to the prompt they should reply to
    Prompting(PlayerMap<String>),
    // map players to their score
    Finished(G::Outcome),
}

// TODO: might be better to put this elsewhere
pub type PlayerId = u64;
// Maps a player to something.
// TODO: non-cryptographic hash function maybe
pub type PlayerMap<T> = HashMap<PlayerId, T>;
