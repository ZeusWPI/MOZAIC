use std::process;
use std::io::{LineWriter, BufReader, Write};
use futures::Future;
use tokio_process::{Child, ChildStdin, ChildStdout, CommandExt};

use tokio_io::io;
use tokio_core::reactor::Handle;

use std::io::Error as IoError;

use game::*;
use match_runner::*;

// A collection of running bots (i.e. process handles)
pub struct BotRunner {
    // Maps player ids to their process handles
    processes: PlayerMap<Child>,
}

impl BotRunner {
    pub fn run(handle: &Handle, players: &PlayerMap<PlayerConfig>) -> Self {
        BotRunner {
            processes: players.iter().map(|(&id, config)| {
                let process = process::Command::new(&config.command)
                    .args(&config.args)
                    .arg(format!("{}", config.name.as_str()))
                    .stdin(process::Stdio::piped())
                    .stdout(process::Stdio::piped())
                    .spawn_async(handle)
                    .expect(&format!(
                        "\n[DRIVER] Failed to execute process: {} {:?}\n",
                        config.command,
                        config.args
                    ));
                return (id, process);
            }).collect()
        }
    }

    pub fn player_handles<'p>(&'p mut self) -> PlayerMap<PlayerHandle<'p>> {
        self.processes.iter_mut().map(|(&player_id, process)| {
            (player_id, PlayerHandle::new(process))
        }).collect()
    }

    pub fn kill(mut self) {
        for handle in self.processes.values_mut() {
            handle.kill().expect("Couldn't kill bot");
        }
    }
}


pub struct PlayerHandle<'p> {
    process: &'p mut Child
}

impl<'p> PlayerHandle<'p> {
    pub fn new(process: &'p mut Child) -> Self {
        PlayerHandle { process }
    }

    fn write_msg(&mut self, msg: &str) {
        let stdin = self.process.stdin().as_mut().unwrap();
        write!(stdin, "{}\n", msg);
    }

    pub fn prompt<'a>(&'a mut self, msg: &str) -> impl Future<Item = String, Error = IoError> + 'a {
        self.write_msg(msg);
        let stdout = self.process.stdout().as_mut().unwrap();
        let reader = BufReader::new(stdout);
        let bytes = io::read_until(reader, b'\n', Vec::new());
        return bytes.map(|(_, vec)| String::from_utf8(vec).unwrap());
    }
}
