use std::collections::HashMap;
use std::process;

use game_types::{Player};

 #[derive(Serialize, Deserialize, Debug)]
pub struct MatchConfig {
    pub players: Vec<PlayerConfig>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub id: u64,
    pub command: String,
    pub args: Vec<Sring>,
}

pub type BotHandles = HashMap<u64, process::Child>;

// A collection of running bots (i.e. process handles)
pub struct Bots {
    // Maps bot ids to their process handles
    handles: HashMap<u64, process::Child>,
}

impl Bots {
    pub fn start(configs: &Vec<PlayerConfig>) -> Self {
        unimplemented!()
    }

    // Communicates prompts to the respective players, and aggregates their
    // responses.
    pub fn handle_prompts(&mut self, &Vec<Prompt>) -> Vec<Response> {
        unimplemented!()
    }

    pub fn kill(self) {
        unimplemented!()
    }
}
