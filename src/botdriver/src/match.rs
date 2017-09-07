use game::*;
use bot_runner::Bots;

// TODO: logs
pub struct MatchRunner<G> {
    game_state: G,
    bots: Bots,
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
