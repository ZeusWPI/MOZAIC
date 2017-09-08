use std::marker::PhantomData;
use game::*;
use bot_runner::*;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
}

pub struct MatchRunner<'a, G: Game> {
    pub config: MatchConfig<'a, G>,
    pub players: PlayerMap<PlayerHandle<'a>>,
    // TODO: logger
}

impl<'a, G> MatchRunner<'a, G> where G: Game {
    pub fn run(&mut self) -> G::Outcome {
        let (mut game_state, mut status) = G::init(&self.config);
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
