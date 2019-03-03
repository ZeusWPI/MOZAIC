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

use cursive::CbFunc;
use cursive::align::VAlign;
use cursive::Cursive;
use cursive::theme::Theme;
use cursive::traits::{Boxable, Identifiable};
use cursive::views::{TextView, EditView, LinearLayout};

pub mod chat {
    include!(concat!(env!("OUT_DIR"), "/chat_capnp.rs"));
}

fn main() {
    // Creates the cursive root - required for every application.
    let mut siv = Cursive::default();

    siv.set_theme({
        let mut t = Theme::default();
        t.shadow = false;
        t
    });

    siv.add_layer(LinearLayout::vertical()
        .child(TextView::empty()
            .v_align(VAlign::Bottom)
            .with_id("messages")
            .full_height())
        .child(EditView::new()
            .on_submit(|cursive, s| {
                cursive.call_on_id("messages", |view: &mut TextView| {
                    view.append(s);
                    view.append("\n");
                });
                cursive.call_on_id("input", |view: &mut EditView| {
                    view.set_content("");
                });
            })
            .with_id("input")
            .full_width())
    );

    let cb_sink = siv.cb_sink().clone();

    thread::spawn(move || {
        let addr = "127.0.0.1:9142".parse().unwrap();

        tokio::run(futures::lazy(move || {
            let rt = RuntimeState::bootstrap(|runtime| {
                let (tx, rx) = mpsc::unbounded();

                RuntimeWorker::spawn(rx, cb_sink, runtime);

                return tx;
            });

            TcpStream::connect(&addr)
                .map_err(|err| panic!(err))
                .and_then(move |stream| {
                    LinkHandler::new(stream, rt, |params| {
                        let r = ClientReactor {
                            greeter_id: params.greeter_id,
                        };
                        return r.params();
                    })
                })
            }));
    });

    siv.set_fps(10);
    // Starts the event loop.
    siv.run();
}

struct HandlerState {
    cb_sink: crossbeam_channel::Sender<Box<CbFunc>>,
    runtime: Arc<Mutex<RuntimeState>>,
}

struct RuntimeWorker {
    msg_chan: mpsc::UnboundedReceiver<Message>,
    handler_core: HandlerCore<HandlerState>,
}

impl RuntimeWorker {
    fn spawn(
        rx: mpsc::UnboundedReceiver<Message>,
        cb_sink: crossbeam_channel::Sender<Box<CbFunc>>,
        runtime: Arc<Mutex<RuntimeState>>
    ) {
            let worker = RuntimeWorker {
                msg_chan: rx,
                handler_core: HandlerCore::new(
                    HandlerState {
                        cb_sink,
                        runtime,
                    }
                )
            };
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

    pub fn on<M, H>(&mut self, _m: M, h: H)
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


struct ClientReactor {
    greeter_id: ReactorId,
}

impl ClientReactor {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, CtxHandler::new(Self::initialize));
        return params;
    }

    fn initialize<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        let link = (ServerLink {}).params(self.greeter_id.clone());
        handle.open_link(link);

        handle.send_internal(send_greeting::Owned, |b| {
            let mut greeting: send_greeting::Builder = b.init_as();
            greeting.set_message("Hey friend!");
        });

        return Ok(());
    }
}

struct ServerLink {
}

impl ServerLink {
    fn params<C: Ctx>(self, foreign_id: ReactorId) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_id, self);

        params.external_handler(
            terminate_stream::Owned,
            CtxHandler::new(Self::close_handler),
        );

        params.internal_handler(
            send_greeting::Owned,
            CtxHandler::new(Self::send_greeting),
        );
        return params;
    }

    fn send_greeting<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        send_greeting: send_greeting::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = send_greeting.get_message()?;

        handle.send_message(greeting::Owned, |b| {
            let mut greeting: greeting::Builder = b.init_as();
            greeting.set_message(message);
        });

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