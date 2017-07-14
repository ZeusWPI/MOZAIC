pub trait Game {
    fn init(names: Vec<Player>) -> Self;
    fn start(&mut self) -> GameStatus;
    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus;
}

/*
 * A configuration for a single game, containing metadata about for example:
 *  - players
 *  - maximum step count
 *  - ...
 */
 #[derive(Serialize, Deserialize)]
pub struct GameConfig {
    pub players: Vec<PlayerConfig>
}

#[derive(Serialize, Deserialize)]
pub struct PlayerConfig {
    pub name: Player,
    pub start_command: StartCommand
}

/*
 * A shell command executing the bot in question.
 */
pub type StartCommand = String;

/* 
 * The identification for a player.
 */
pub type Player = String;

/*
 * The list off all players.
 */
pub type PlayerList = Vec<Player>;

/*
 * The commands received from the players.
 */
pub type PlayerOutput = Vec<(Player, PlayerCommand)>;


/*
 * The commands received from a player.
 */
pub type PlayerCommand = String; 

/*
 * Possible outcome of a game.
 * The winner(s) in case of a succesful game,
 * or the error's and causes in case something went wrong.
 */
#[derive(Debug)]
pub enum Outcome {
    Score(Scoring),
    Error,
}

/*
 * A list of scores the players received on game end.
 */
pub type Scoring = Vec<(Player, Score)>;

/*
 * A score a player receives for finishing a game.
 */
pub type Score = i32;

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
pub type PlayerInput = Vec<(Player, GameInfo)>;

/*
 * The (new) info a player receives,
 * enabling them to calculate their next move.
 */
pub type GameInfo = String;

 // TODO: Implement things with warnings (non-blocking faulty moves)
 // TODO: Implement things with logging