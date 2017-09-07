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

// A collection of running bots (i.e. process handles)
pub struct Players {
    // Maps player ids to their process handles
    handles: HashMap<u64, process::Child>,
}

impl Players {
    pub fn start(configs: &Vec<PlayerConfig>) -> Self {
        let mut handles = HashMap::with_capacity(configs.len());
        for player_config in configs.iter() {
            let handle = process::Command::new(player_config.command)
                .args(player_config.args)
                .arg(player_config.id)
                .stdin(process::Stdio::piped())
                .stdout(process::Stdio::piped())
                .spawn()
                .expect(&format!("\n[DRIVER] Failed to execute process: {} {:?}\n", cmd, args));
            handles.insert(player_config.id, handle);
        }
        return Players { handles };
    }

    // Communicates prompts to the respective players, and aggregates their
    // responses.
    pub fn handle_prompts(&self, prompts: &Vec<Prompt>) -> Vec<Response> {
        self.send_prompts(prompts);
        return self.read_responses(prompts);
    }

    fn send_prompts(&self, prompts: &Vec<Prompt>) {
        for prompt in promts.iter() {
            let player_in = self.handles[prompt.id].stdin.unwrap();
            player_in.write_fmt(format_args!("{}\n", prompt.data))?;
            player_in.flush();
        }
    }

    fn read_responses(&self, prompts: &Vec<Prompt>) -> Vec<Response> {
        prompts.iter().map(|prompt| {
            let id = prompt.id;
            let mut reader = BufReader::new(self.handles[id].stdout.unwrap());
            let mut data = String::new();
            // for now, panic on invalid output - we don't have error handling yet.
            reader.read_line(&mut data).unwrap();
            return Response { id, data };
        }).collect()
    }

    pub fn kill(self) {
        for handle in self.handles.values() {
            handle.kill();
        }
    }
}
