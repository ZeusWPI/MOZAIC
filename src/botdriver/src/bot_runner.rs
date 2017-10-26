use std::process::{Command, Stdio};
use futures::{Future, Poll};
use tokio_process::{Child, ChildStdin, ChildStdout, CommandExt};
use tokio_core::reactor::{Handle, Core};

use std::io::{Read, Write, Error, Result};
use tokio_io::{AsyncRead, AsyncWrite};

use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
}

pub fn spawn_bots(handle: &Handle, players: &Vec<PlayerConfig>)
                  -> HashMap<String, BotHandle>
{
    players.iter().map(|config| {
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args);
        cmd.arg(format!("{}", config.name.as_str()));

        let handle = BotHandle::spawn(cmd, handle)
            .expect(&format!(
                "\n[DRIVER] Failed to execute process: {} {:?}\n",
                config.command,
                config.args
            ));
        return (config.name.clone(), handle);
    }).collect()
}

pub struct BotHandle {
    process: Child,
    stdin: ChildStdin,
    stdout: ChildStdout,
}

impl Read for BotHandle {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize> {
        self.stdout.read(buf)
    }
}

impl AsyncRead for BotHandle {}

impl Write for BotHandle {
    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        self.stdin.write(buf)
    }

    fn flush(&mut self) -> Result<()> {
        self.stdin.flush()
    }
}

impl AsyncWrite for BotHandle {
    fn shutdown(&mut self) -> Poll<(), Error> {
        self.stdin.shutdown()
    }
}

impl BotHandle {
    pub fn spawn(mut command: Command, handle: &Handle) -> Result<BotHandle> {
        command
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn_async(handle)
            .map(|process| BotHandle::new(process))
    }

    pub fn new(mut process: Child) -> BotHandle {
        BotHandle {
            stdin: process.stdin().take().unwrap(),
            stdout: process.stdout().take().unwrap(),
            process: process,
        }
    }
}


pub fn test() {
    let mut core = Core::new().unwrap();
    let mut cmd = Command::new("./test.sh");
    let bot = BotHandle::spawn(cmd, &core.handle()).unwrap();
}
