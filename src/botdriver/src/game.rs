use std::collections::HashMap;
use logger::*;

pub trait Game : Sized {
    type Outcome;
    type Config;

    // returns game state and initial status
    fn init(config: MatchParams<Self>) -> (Self, GameStatus<Self>);
    // process player input and execute a game turn
    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus<Self>;
}

pub struct MatchParams<G: Game> {
    // map player ids to advertised names
    pub players: PlayerMap<PlayerInfo>,
    pub game_config: G::Config,
    pub logger: Logger,
}

#[derive(Clone)]
pub struct PlayerInfo {
    pub name: String,
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus<G> where G: Game {
    // map players to the prompt they should reply to
    Prompting(PlayerMap<String>),
    Finished(G::Outcome),
}

pub type PlayerId = usize;
// Maps a player to something.
// TODO: non-cryptographic hash function maybe
pub type PlayerMap<T> = HashMap<PlayerId, T>;
