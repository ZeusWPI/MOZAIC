use std::process::{Command, Stdio};
use futures::{Future, Poll, Async, StartSend};
use futures::stream::{Stream, StreamFuture};
use futures::sink::{Sink, Send};
use tokio_process::{Child, ChildStdin, ChildStdout, CommandExt};
use tokio_io::codec::{Encoder, Decoder, Framed};

use tokio_core::reactor::{Handle, Core};

use std::io::{Read, Write, Error, ErrorKind, Result};
use tokio_io::{AsyncRead, AsyncWrite};
use std;

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
                let mut cmd = Command::new(&config.command);
                cmd.args(&config.args);
                cmd.arg(format!("{}", config.name.as_str()));

                let handle = BotHandle::spawn(cmd, handle)
                    .expect(&format!(
                        "\n[DRIVER] Failed to execute process: {} {:?}\n",
                        config.command,
                        config.args
                    ));
                unimplemented!()
            }).collect()
        }
    }

    // pub fn player_handles<'p>(&'p mut self) -> PlayerMap<PlayerHandle<'p>> {
    //     self.processes.iter_mut().map(|(&player_id, process)| {
    //         //(player_id, PlayerHandle::new(process))
    //         unimplemented!()
    //     }).collect()
    // }

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


enum PromptState<T>
    where T: Stream + Sink
{
    Writing(Send<T>),
    Reading(StreamFuture<T>),
}

struct Prompt<T>
    where T: Stream + Sink
{
    state: PromptState<T>,
}

impl<T> Prompt<T>
    where T: Stream + Sink
{
    fn new(trans: T, msg: T::SinkItem) -> Self {
        Prompt { state: PromptState::Writing(trans.send(msg)) }
    }
}

impl<T> Future for Prompt<T>
    where T: Stream + Sink
{
    type Item = (T::Item, T);
    type Error = ();

    fn poll(&mut self) -> Poll<(T::Item, T), ()> {
        loop {
            let new_state;
            match self.state {
                PromptState::Writing(ref mut future) => {
                    let transport = match future.poll() {
                        Ok(Async::Ready(t)) => t,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err(e) => panic!("error"),
                    };
                    new_state = PromptState::Reading(transport.into_future());
                },
                PromptState::Reading(ref mut future) => {
                    let (item, transport) = match future.poll() {
                        Ok(Async::Ready(p)) => p,
                        Ok(Async::NotReady) => return Ok(Async::NotReady),
                        Err((err, transport)) => panic!("error"),
                    };
                    return Ok(Async::Ready((item.unwrap(), transport)));
                }
            };
            self.state = new_state;
        }
    }
}


struct PoC<T>
    where T: Stream + Sink
{
    prompt: Prompt<T>,
    count: usize,
}

impl<T> PoC<T>
    where T: Stream<Item = String> + Sink<SinkItem = String>
{
    fn new(transport: T) -> PoC<T> {
        PoC {
            count: 0,
            prompt: Prompt::new(transport, "hoi".to_string()),
        }
    }
}


// interface towards game implementation
pub struct PlayerHandle {
    transport: Framed<BotHandle, LineCodec>,
}

impl PlayerHandle {
    pub fn prompt(self, msg: String) -> Prompt<PlayerHandle> {
        Prompt::new(self, msg)
    }
}

impl Stream for PlayerHandle {
    type Item = String;
    type Error = Error;

    fn poll(&mut self) -> Poll<Option<String>, Error> {
        self.transport.poll()
    }
}

impl Sink for PlayerHandle {
    type SinkItem = String;
    type SinkError = Error;

    fn start_send(&mut self, item: String) -> StartSend<String, Error> {
        self.transport.start_send(item)
    }

    fn poll_complete(&mut self) -> Poll<(), Error> {
        self.transport.poll_complete()
    }
}

impl<T> Future for PoC<T>
    where T: Stream<Item = String> + Sink<SinkItem = String>
{
    type Item = String;
    type Error = ();

    fn poll(&mut self) -> Poll<String, Self::Error> {
        loop {
            let (item, stream) = match (self.prompt.poll()) {
                Ok(Async::Ready(t)) => t,
                Ok(Async::NotReady) => return Ok(Async::NotReady),
                Err(err) => return Err(err),
            };
            let line = item;
            println!("{}: {}", self.count, line);
            self.count += 1;
            if self.count < 10 {
                self.prompt = Prompt::new(stream, line);
            } else {
                return Ok(Async::Ready(line));
            }
        }
    }
}

pub fn test() {
    let mut core = Core::new().unwrap();
    let mut cmd = Command::new("./test.sh");
    let bot = BotHandle::spawn(cmd, &core.handle()).unwrap();
    let mut transport = bot.framed(LineCodec);
    let action = PoC::new(transport);
    core.run(action).unwrap();
}
