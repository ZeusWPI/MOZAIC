use std::marker::PhantomData;
use game::*;
use bot_runner::*;
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug)]
pub struct MatchDescription {
    pub players: PlayerMap<PlayerConfig>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
}

struct MatchRunner<'a, G: Game> {
    config: MatchConfig<'a, G>,
    players: PlayerMap<PlayerHandle<'a>>,
    //temporary
    phantom_game: PhantomData<G>,
    // TODO: logger
}

impl<'a, G> MatchRunner<'a, G> where G: Game {
    fn run(&mut self) -> G::Outcome {
        let (mut game_state, mut status) = G::State::init(&self.config);
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
