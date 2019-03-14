extern crate mozaic;
extern crate sodiumoxide;
extern crate hex;
extern crate tokio;
#[macro_use]
extern crate futures;
extern crate prost;
extern crate rand;
extern crate cursive;
extern crate crossbeam_channel;
extern crate capnp;

use tokio::net::TcpStream;
use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc;
use std::sync::{Arc, Mutex};


use mozaic::core_capnp::{initialize, terminate_stream, send_greeting, greeting};
use mozaic::messaging::reactor::*;
use mozaic::messaging::types::*;
use mozaic::client::{LinkHandler, RuntimeState};

use capnp::any_pointer;
use capnp::traits::{Owned, HasTypeId};

use std::thread;
use std::collections::HashMap;
use std::marker::PhantomData;
use std::env;
use std::process::{Command, Stdio, ChildStdin};
use std::io::{Write, BufReader, BufRead};

pub mod chat {
    include!(concat!(env!("OUT_DIR"), "/chat_capnp.rs"));
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        println!("please specify what bot to run");
        return; // wtf how to exit rust program
    }

    let user = args.get(1).unwrap_or(&"Ben".to_string()).clone();
    println!("current user {}", user);

    let addr = "127.0.0.1:9142".parse().unwrap();
    // Spawn program
    let mut prog = Command::new(&args[1])
        .args(args.iter().skip(2))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("Process spawn failed");

    let stdout = BufReader::new(prog.stdout.take().expect("No stdout"));
    let mut stdin = Arc::new(Mutex::new(prog.stdin.take().expect("No stdin")));
    // thread::spawn(move || {
    //     let mut stdin = stdin;
    //     for i in 0..10 {
    //         println!("printing {}", i);
    //         let input = format!("{}\n", i);
    //         stdin.write_all(input.as_bytes());
    //         thread::sleep_ms(100);
    //     }
    // });
    
    // let mut line = String::new();

    // while let Ok(x) = stdout.read_line(&mut line) {
    //     if x == 0 {
    //         break;
    //     }

    //     println!("{} bytes {}", line, x);
    //     line = String::new();
    // }

    tokio::run(futures::lazy(move || {
        // This part is needlessly complex, please ignore =/
        let rt = RuntimeState::bootstrap(|runtime| {
            let (tx, rx) = mpsc::unbounded();

            // Spawn runtimeworker with program output
            runtime::RuntimeWorker::spawn(rx, stdout, runtime);

            return tx;
        });

        TcpStream::connect(&addr)
            .map_err(|err| panic!(err))
            .and_then(move |stream| {

                LinkHandler::new(stream, rt, move |params| {
                    // Create client reactor wich spawns program link to write to program
                    let r = ClientReactor {
                        greeter_id: params.greeter_id,
                        runtime_id: params.runtime_id,
                        user: user.clone(),
                        stdin: stdin.clone(),
                    };
                    return r.params();
                })
            })
    }));
}

// Main client logic
struct ClientReactor {
    greeter_id: ReactorId,
    runtime_id: ReactorId,
    user: String,
    stdin: Arc<Mutex<ChildStdin>>,
}

impl ClientReactor {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, CtxHandler::new(Self::initialize));

        params.handler(
            chat::chat_message::Owned,
            CtxHandler::new(Self::handle_chat_message),
        );

        return params;
    }

    fn handle_chat_message<C: Ctx>(
        &mut self,
        _handle: &mut ReactorHandle<C>,
        message: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error> {
        let user = message.get_user()?;
        if user == self.user {
            return Ok(());
        }

        let text = message.get_message()?;
        println!("handling message {}", text);
        let text = format!("{}\n", text);
        self.stdin.lock().map(move |mut s| s.write_all(text.as_bytes()).expect("Something else didn't work lol")).expect("Something failed lol");
        Ok(())
    }

    // reactor setup
    fn initialize<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        // open link with chat server
        let link = (ServerLink {}).params(self.greeter_id.clone());
        handle.open_link(link);

        // open link with runtime, for communicating with chat GUI
        let runtime_link = (RuntimeLink {user: self.user.clone()}).params(self.runtime_id.clone());
        handle.open_link(runtime_link);

        // dispatch this additional message to instruct the runtime link
        // to connect to the gui.
        // TODO: this is kind of initalization code, could it be avoided?
        let msg = MsgBuffer::<chat::connect_to_gui::Owned>::new();
        handle.send_internal(msg);

        return Ok(());
    }
}

// Handler for the connection with the chat server
struct ServerLink {}

impl ServerLink {
    fn params<C: Ctx>(self, foreign_id: ReactorId) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_id, self);

        params.external_handler(
            terminate_stream::Owned,
            CtxHandler::new(Self::close_handler),
        );

        params.external_handler(
            chat::chat_message::Owned,
            CtxHandler::new(Self::receive_chat_message),
        );

        params.internal_handler(
            chat::send_message::Owned,
            CtxHandler::new(Self::send_chat_message),
        );

        return params;
    }

    // pick up a 'send_message' event from the reactor, and put it to effect
    // by constructing the chat message and sending it to the chat server.
    fn send_chat_message<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        send_message: chat::send_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = send_message.get_message()?;
        let user = send_message.get_user()?;

        let mut chat_message = MsgBuffer::<chat::chat_message::Owned>::new();
        chat_message.build(|b| {
            b.set_message(message);
            b.set_user(user);
        });
        
        handle.send_message(chat_message);

        return Ok(());
    }

    // receive a chat message from the chat server, and broadcast it on the
    // reactor.
    fn receive_chat_message<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        chat_message: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = chat_message.get_message()?;
        let user = chat_message.get_user()?;
        
        println!("{}: {}", user, message);
    
        let mut chat_message = MsgBuffer::<chat::chat_message::Owned>::new();
        chat_message.build(|b| {
            b.set_message(message);
            b.set_user(user);
        });
        handle.send_internal(chat_message);

        return Ok(());
    }

    fn close_handler<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        _: terminate_stream::Reader,
    ) -> Result<(), capnp::Error>
    {
        // also close our end of the stream
        handle.close_link();
        return Ok(());
    }

}

// 
struct RuntimeLink {
    user: String,
}

impl RuntimeLink {
    fn params<C: Ctx>(self, foreign_id: ReactorId) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_id, self);
        params.internal_handler(
            chat::connect_to_gui::Owned,
            CtxHandler::new(Self::connect_to_gui),
        );

        // params.internal_handler(
        //     chat::chat_message::Owned,
        //     CtxHandler::new(Self::handle_chat_message),
        // );

        params.external_handler(
            chat::user_input::Owned,
            CtxHandler::new(Self::handle_user_input),
        );

        return params;
    }

    // Send a message to the GUI controller to subscribe to input events.
    fn connect_to_gui<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        _: chat::connect_to_gui::Reader,
    ) -> Result<(), capnp::Error> 
    {
        let connect = MsgBuffer::<chat::connect_to_gui::Owned>::new();
        handle.send_message(connect);
        return Ok(());
    }

    // // Pick up chat messages on the reactor, and forward them to the chat GUI.
    // fn handle_chat_message<C: Ctx>(
    //     &mut self,
    //     handle: &mut LinkHandle<C>,
    //     chat_message: chat::chat_message::Reader,
    // ) -> Result<(), capnp::Error>
    // {
    //     let message = chat_message.get_message()?;
    //     let user = chat_message.get_user()?;

    //     let mut chat_message = MsgBuffer::<chat::chat_message::Owned>::new();
    //     chat_message.build(|b| {
    //         b.set_message(message);
    //         b.set_user(user);
    //     });
    //     handle.send_message(chat_message);

    //     return Ok(());
    // }

    fn handle_user_input<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        input: chat::user_input::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = input.get_text()?;

        let mut send_message = MsgBuffer::<chat::send_message::Owned>::new();
        send_message.build(|b| {
            b.set_message(message);
            b.set_user(&self.user);
        });
        handle.send_internal(send_message);

        return Ok(());
    }
}

// this code is hacked together, don't pay too much attention to it.
mod runtime {
    use capnp::any_pointer;
    use capnp::traits::{Owned, HasTypeId};
    use chat;
    use crossbeam_channel;
    use cursive::{Cursive, CbFunc};
    use cursive::views::{TextView, EditView};
    use futures::{Future, Async, Poll, Stream};
    use futures::sync::mpsc;
    use mozaic::client::runtime::RuntimeState;
    use mozaic::messaging::types::*;
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};
    use std::io::{BufRead, BufReader};
    use std::process::ChildStdout;
    use std::mem;
    use std::thread;

    pub struct RuntimeWorker {
        msg_chan: mpsc::UnboundedReceiver<Message>,
        handler_core: HandlerCore<HandlerState>,
    }

    struct HandlerState {
        stdout: BufReader<ChildStdout>,
        runtime: Arc<Mutex<RuntimeState>>,
    }

    impl RuntimeWorker {
        pub fn spawn(
            rx: mpsc::UnboundedReceiver<Message>,
            stdout: BufReader<ChildStdout>,
            runtime: Arc<Mutex<RuntimeState>>
        ) {
                let mut worker = RuntimeWorker {
                    msg_chan: rx,
                    handler_core: HandlerCore::new(
                        HandlerState {
                            stdout: stdout, runtime,
                        }
                    )
                };

                worker.handler_core.on(
                    // This is initialize program ish ish
                    chat::connect_to_gui::Owned,
                    FnHandler::new(rt_connect_to_gui),
                );

                // worker.handler_core.on(
                //     chat::chat_message::Owned,
                //     FnHandler::new(rt_display_chat_message),
                // );

                tokio::spawn(worker);
        }

        fn handle_message(&mut self, msg: Message) {
            self.handler_core.handle(&msg)
                .expect("message handling failed");
        }
    }

    impl Future for RuntimeWorker {
        type Item = ();
        type Error = ();

        fn poll(&mut self) -> Poll<(), ()> {
            loop {
                match try_ready!(self.msg_chan.poll()) {
                    None => return Ok(Async::Ready(())),
                    Some(msg) => self.handle_message(msg),
                }
            }
        }
    }

    fn rt_connect_to_gui(
        ctx: &mut RtHandlerCtx<HandlerState>,
        _: chat::connect_to_gui::Reader
    ) -> Result<(), capnp::Error>
    {
        println!("Connecting to 'gui'");

        let reactor_id = ctx.sender_id.clone();
        let runtime = ctx.state.runtime.clone();

        let mut input_text = String::new();

        while let Ok(x) = ctx.state.stdout.read_line(&mut input_text) {
            if x == 0 {
                break;
            }

            runtime.lock().unwrap().send_message(
                &reactor_id,
                chat::user_input::Owned,
                |b| {
                    let mut input: chat::user_input::Builder = b.init_as();
                    input.set_text(input_text.trim_end());
                });
            input_text = String::new();
        }

        println!("Program finished somewhere");

        return Ok(());
    }

    struct RtHandlerCtx<'a, S> {
        pub sender_id: &'a ReactorId,
        pub state: &'a mut S,
    }


    type RtMsgHandler<S> = Box<
        for<'a>
            Handler<'a,
                RtHandlerCtx<'a, S>,
                any_pointer::Owned, Output=(), Error=capnp::Error>
    >;

    pub struct HandlerCore<S> {
        state: S,
        handlers: HashMap<u64, RtMsgHandler<S>>,
    }

    impl<S> HandlerCore<S> {
        pub fn new(state: S) -> Self {
            HandlerCore {
                state,
                handlers: HashMap::new(),
            }
        }

        fn on<M, H>(&mut self, _m: M, h: H)
            where M: for<'a> Owned<'a> + Send + 'static,
                <M as Owned<'static>>::Reader: HasTypeId,
                H: 'static + for <'a> Handler<'a, RtHandlerCtx<'a, S>, M, Output=(), Error=capnp::Error>
        {
            let boxed = Box::new(AnyPtrHandler::new(h));
            self.handlers.insert(
                <M as Owned<'static>>::Reader::type_id(),
                boxed,
            );
        }

        pub fn handle(&mut self, message: &Message)
            -> Result<(), capnp::Error>
        {
            let reader = message.reader();
            let type_id = reader.get()?.get_type_id();
            if let Some(handler) = self.handlers.get(&type_id) {
                let sender_id: ReactorId = reader.get()?.get_sender()?.into();
                let mut ctx = RtHandlerCtx {
                    sender_id: &sender_id,
                    state: &mut self.state,
                };
                handler.handle(&mut ctx, reader.get()?.get_payload())?;
            }
            return Ok(());
        }
    }

}