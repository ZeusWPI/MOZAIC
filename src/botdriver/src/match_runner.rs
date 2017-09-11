use std::collections::HashMap;

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
                    self.send_prompts(&prompts);
                    let responses = self.receive_responses(&prompts);
                    status = game_state.step(&responses);
                }
            }
        }
    }

    fn send_prompts(&mut self, prompts: &PlayerMap<String>) {
        for (player_id, prompt) in prompts {
            let handle = self.players.get_mut(player_id).unwrap();
            handle.send_msg(prompt).unwrap();
        }
    }

    fn receive_responses(&mut self, prompts: &PlayerMap<String>) -> PlayerMap<String> {
        let mut responses = HashMap::with_capacity(prompts.len());
        for player_id in prompts.keys() {
            let handle = self.players.get_mut(player_id).unwrap();
            if let Ok(response) = handle.recv_msg() {
                responses.insert(*player_id, response);
            }
        }
        return responses;
    }
}
