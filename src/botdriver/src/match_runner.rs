use futures::Future;

use game::*;
use bot_runner::*;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
}

pub struct MatchRunner<'g> {
    pub players: PlayerMap<PlayerHandle<'g>>,
}

impl<'g> MatchRunner<'g> {
    pub fn run<G>(&mut self, config: MatchParams<G>) -> G::Outcome
        where G: Game
    {
        let (mut game_state, mut status) = G::init(config);
        loop {
            match status {
                GameStatus::Finished(outcome) => return outcome,
                GameStatus::Prompting(prompts) => {
                    let responses = self.prompt_bots(&prompts);
                    status = game_state.step(&responses);
                }
            }
        }
    }

    fn prompt_bots(&mut self, prompts: &PlayerMap<String>) -> PlayerMap<String> {
        prompts.iter().map(|(&player_id, prompt_text)| {
            let handle = self.players.get_mut(&player_id).unwrap();
            let resp = handle.prompt(prompt_text).wait().unwrap();
            return (player_id, resp);
        }).collect()
    }
}
