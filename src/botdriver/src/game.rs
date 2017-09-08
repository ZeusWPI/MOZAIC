use match_runner::PlayerConfig;
use std::collections::HashMap;

pub trait Game<'g> : Sized {
    type Outcome;
    type Config;

    // returns game state and initial status
    fn init(config: &MatchConfig<'g, Self>) -> (Self, GameStatus<'g, Self>);
    // process player input and execute a game turn
    fn step(&mut self, responses: &PlayerMap<'g, String>) -> GameStatus<'g, Self>;
}

// TODO: better name
pub struct MatchConfig<'g, G: Game<'g>> {
    // map player ids to advertised names
    pub players: &'g Vec<PlayerId<'g>>,
    pub game_config: G::Config,
}

// reason why the game returned control
#[derive(Debug)]
pub enum GameStatus<'g, G> where G: Game<'g> {
    // map players to the prompt they should reply to
    Prompting(PlayerMap<'g, String>),
    Finished(G::Outcome),
}

// TODO: might be better to put this elsewhere
pub type PlayerId<'g> = &'g str;
// Maps a player to something.
// TODO: non-cryptographic hash function maybe
pub type PlayerMap<'g, T> = HashMap<PlayerId<'g>, T>;
