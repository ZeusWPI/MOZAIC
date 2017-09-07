use std::collections::HashMap;
use std::process;
use std::io;
use std::io::{Write, BufRead};

use game::*;

 #[derive(Serialize, Deserialize, Debug)]
pub struct MatchConfig {
    pub players: Vec<PlayerConfig>
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub id: u64,
    pub command: String,
    pub args: Vec<String>,
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
            let handle = process::Command::new(&player_config.command)
                .args(&player_config.args)
                .arg(format!("{}", player_config.id))
                .stdin(process::Stdio::piped())
                .stdout(process::Stdio::piped())
                .spawn()
                .expect(&format!(
                    "\n[DRIVER] Failed to execute process: {} {:?}\n",
                    player_config.command,
                    player_config.args
                ));
            handles.insert(player_config.id, handle);
        }
        return Players { handles };
    }

    // Communicates prompts to the respective players, and aggregates their
    // responses.
    pub fn handle_prompts(&mut self, prompts: &Vec<Prompt>) -> Vec<Response> {
        self.send_prompts(prompts);
        return self.read_responses(prompts);
    }

    fn send_prompts(&mut self, prompts: &Vec<Prompt>) {
        for prompt in prompts.iter() {
            let ref mut player_in = self.handles.get_mut(&prompt.player_id).unwrap().stdin.as_mut().unwrap();
            player_in.write_fmt(format_args!("{}\n", prompt.data));
            player_in.flush();
        }
    }

    fn read_responses(&mut self, prompts: &Vec<Prompt>) -> Vec<Response> {
        prompts.iter().map(|prompt| {
            let player_id = prompt.player_id;
            // TODO: log errors or something
            let data = self.read_response(player_id).ok();
            return Response { player_id, data };
        }).collect()
    }

    fn read_response(&mut self, player_id: u64) -> io::Result<String> {
        // TODO: remove unwrap
        let player_out = self.handles.get_mut(&player_id).unwrap().stdout.as_mut().unwrap();
        let mut reader = io::BufReader::new(player_out);
        let mut data = String::new();
        reader.read_line(&mut data)?;
        return Ok(data);
    }

    pub fn kill(mut self) {
        for handle in self.handles.values_mut() {
            handle.kill();
        }
    }
}
