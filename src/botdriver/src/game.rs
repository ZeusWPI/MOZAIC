use match_runner::PlayerConfig;
use std::collections::HashMap;

pub trait Game : Sized {
    type Outcome;
    type Config;

    // returns game state and initial status
    fn init<'a>(config: &'a MatchConfig<'a, Self>) -> (Self, GameStatus<Self>);
    // process player input and execute a game turn
    fn step(&mut self, responses: &PlayerMap<String>) -> GameStatus<Self>;
}

// TODO: better name
pub struct MatchConfig<'a, G: Game> {
    // map player ids to advertised names
    pub players: PlayerMap<&'a str>,
    pub game_config: G::Config,
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus<G> where G: Game {
    // map players to the prompt they should reply to
    Prompting(PlayerMap<String>),
    Finished(G::Outcome),
}

// TODO: might be better to put this elsewhere
pub type PlayerId = u64;
// Maps a player to something.
// TODO: non-cryptographic hash function maybe
pub type PlayerMap<T> = HashMap<PlayerId, T>;
