use std::process;
use futures::Future;
use tokio_process::{Child, ChildStdin, ChildStdout, CommandExt};
use tokio_io::codec::{Encoder, Decoder};

use tokio_core::reactor::Handle;

use std::io::{Read, Write, Error, ErrorKind, Result};
use tokio_io::io;

use bytes::{BytesMut, BufMut};

use std::str;

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
            //(player_id, PlayerHandle::new(process))
            unimplemented!()
        }).collect()
    }

    pub fn kill(mut self) {
        for handle in self.processes.values_mut() {
            handle.kill().expect("Couldn't kill bot");
        }
    }
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

impl Write for BotHandle {
    fn write(&mut self, buf: &[u8]) -> Result<usize> {
        self.stdin.write(buf)
    }

    fn flush(&mut self) -> Result<()> {
        self.stdin.flush()
    }
}

impl BotHandle {
    fn new(mut process: Child) -> BotHandle {
        BotHandle {
            stdin: process.stdin().take().unwrap(),
            stdout: process.stdout().take().unwrap(),
            process: process,
        }
    }
}

pub struct LineCodec;

impl Encoder for LineCodec {
    type Item = String;
    type Error = Error;

    fn encode(&mut self, msg: String, buf: &mut BytesMut) -> Result<()> {
        buf.extend(msg.as_bytes());
        buf.extend(b"\n");
        Ok(())
    }
}

impl Decoder for LineCodec {
    type Item = String;
    type Error = Error;

    fn decode(&mut self, buf: &mut BytesMut) -> Result<Option<String>> {
        if let Some(pos) = buf.iter().position(|&b| b == b'\n') {
            // remove frame from buffer
            let line = buf.split_to(pos);

            // remove newline
            buf.split_to(1);

            match str::from_utf8(&line) {
                Ok(s)  => Ok(Some(s.to_string())),
                Err(_) => Err(Error::new(ErrorKind::Other, "invalid UTF-8")),
            }
        } else {
            Ok(None)
        }
    }
}

pub struct PlayerHandle<'p> {
    process: &'p mut Child
}
