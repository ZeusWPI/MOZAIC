use game::*;
use bot_runner::*;

// TODO: logs
pub struct MatchRunner<G> {
    game_state: G,
    players: Players,
    logger: MatchLogger,
}

impl<G> MatchRunner<G> where G: Game {
    pub fn init(players: &Vec<PlayerConfig>) -> Self {
        unimplemented!()
    }

    pub fn run(&mut self) {
        unimplemented!()
    }
}

// TODO
struct MatchLogger {
}
