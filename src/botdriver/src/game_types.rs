use std::collections::HashMap;

pub trait Game {
    fn init(names: Vec<Player>) -> Self;
    fn start(&mut self) -> GameStatus;
    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus;
}

/* 
 * The identification for a player.
 */
pub type Player = String;

// TODO: Blame Ilion
// TODO: Stop Wout 2k17
// TODO: Remove humor
// TODO: DOTODOTODOTO
// TODO: Do TODO's
// TODO: Reduce amount of comments
// TODO: Write comments in English
// TODO: Schrijf onderstaande comment in Engels
// TODO: Vind een betere naam voor GameInfo
/*
 * The information about the game we give each player.
 */
 pub type PlayerInput = HashMap<Player, GameInfo>;

/*
 * The (new) info a player receives,
 * enabling them to calculate their next move.
 */
pub type GameInfo = String;

/*
 * The commands received from the players.
 * TODO: Rename to PlayerMoves/Commands/Responses
 */
pub type PlayerOutput = HashMap<Player, PlayerCommand>;

/*
 * The raw commands received from a player.
 */
pub type PlayerCommand = String; 

 /*
 * The output from the game rules.
 * It is the next state (if the game is still running) of the game,
 * and should be communicated to the players or cleaned up.
 */
#[derive(Debug)]
pub enum GameStatus {
    Done(Outcome),
    Running(PlayerInput)
}

/*
 * Possible outcome of a game.
 * The winner(s) in case of a succesful game,
 * or the error's and causes in case something went wrong.
 */
// TODO Improve error type
#[derive(Debug)]
pub enum Outcome {
    Score(Scoring),
    Error(String),
}

/*
 * A list of scores the players received on game end.
 */
pub type Scoring = HashMap<Player, Score>;

/*
 * A score a player receives for finishing a game.
 */
pub type Score = i32;