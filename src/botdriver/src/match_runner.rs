use game::*;
use bot_runner::*;

// TODO: logs
pub struct MatchRunner<G> {
    game_state: G,
    status: ControlStatus,
    players: Players,
    logger: MatchLogger,
}

impl<G> MatchRunner<G> where G: Game {
    // TODO: pass log or something
    pub fn run(config: G::Config, players: &Vec<PlayerConfig>) -> Outcome {
        let mut runner = Self::init(config, players);
        loop {
            match runner.status {
                ControlStatus::Finished(outcome) => return outcome,
                ControlStatus::Prompting(prompts) => {
                    let responses = runner.players.handle_prompts(&prompts);
                    let status = runner.game_state.step(&responses);
                    runner.status = status.control_status;
                    runner.logger.log(status.log_entry);
                }
            }
        }
    }

    fn init(config: G::Config, players: &Vec<PlayerConfig>) -> Self {
        let player_ids = players.iter().map(|conf| conf.id).collect();
        let (game_state, game_status) = G::init(config, player_ids);
        MatchRunner {
            players: Players::start(players),
            game_state,
            status: game_status.control_status,
            logger: MatchLogger,
        }
    }
}

// TODO
struct MatchLogger;

impl MatchLogger {
    fn log(&mut self, log_entry: Option<String>) {
        if let Some(data) = log_entry {
            //self.write(data);
        }
    }
}
