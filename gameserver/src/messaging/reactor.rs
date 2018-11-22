use std::collections::{HashMap, VecDeque};
use super::Handler;
use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};
use futures::{Stream, Poll};
use futures::sync::mpsc;


use capnp::message;

use core_capnp;
use core_capnp::mozaic_message;

#[derive(PartialEq, Eq, Hash)]
pub struct Uuid {
    pub x0: u64,
    pub x1: u64,
}

impl <'a> From<core_capnp::uuid::Reader<'a>> for Uuid {
    fn from(reader: core_capnp::uuid::Reader<'a>) -> Uuid {
        Uuid {
            x0: reader.get_x0(),
            x1: reader.get_x1(),
        }
    }
}

// stub message type, this should be repalced
pub struct Message {
    raw_reader: message::Reader<capnp::serialize::OwnedSegments>,
}

impl Message {
    fn from_segments(segments: capnp::serialize::OwnedSegments) -> Self {
        Message {
            raw_reader: message::Reader::new(
                segments,
                message::ReaderOptions::default(),
            ),
        }
    }

    pub fn reader<'a>(&'a self)
        -> Result<mozaic_message::Reader<'a>, capnp::Error>
    {
        return self.raw_reader.get_root();
    }
}

// TODO: How do we establish links?
// In theory, knowing an UUID is enough to send messages to another actor. In
// reality though, we need to establish some routing state, somewhere, to
// actually make a connection. A reactor like this one should be in contact
// with some router, that can map its uuid to an incoming message channel.
// I guess the same router should receive messages sent by this reactors links,
// and route them to the appropriate places. The question that remains is how
// we lay initial contact: how do we allocate a link to recieve messages
// from some client?
// Maybe it would prove useful to implement a dummy service in this
// architecture.


struct Reactor<S> {
    uuid: Uuid,
    message_chan: mpsc::UnboundedReceiver<Message>,
    broker_handle: mpsc::UnboundedSender<Message>,
    message_queue: VecDeque<Message>,
    internal_state: S,
    internal_handlers: HashMap<u64, CoreHandler<S, (), capnp::Error>>,
    links: HashMap<Uuid, BoxedLink>,
}

struct ReactorHandle<'a> {
    message_queue: &'a mut VecDeque<Message>,
}

impl<'a> ReactorHandle<'a> {
    fn send_message(&mut self, message: Message) {
        self.message_queue.push_back(message);
    }
}


impl<S> Reactor<S> {
    fn receive(&mut self) -> Poll<(), ()> {
        loop {
            match  try_ready!(self.message_chan.poll()) {
                None => panic!("message channel closed"),
                Some(msg) => {
                    self.handle_external_message(msg)
                        .expect("invalid message");
                }
            }
        }
    }

    // receive a foreign message and send it to the appropriate
    // immigration bureau
    fn handle_external_message(&mut self, message: Message)
        -> Result<(), capnp::Error>
    {
        let msg = message.reader()?;
        let sender_uuid = msg.get_sender()?.into();
        {
            let link = self.links.get_mut(&sender_uuid)
                .expect("no link with message sender");

            let reactor_handle = ReactorHandle {
                message_queue: &mut self.message_queue,
            };
            let reactor_ctx = ReactorCtx {
                uuid: &self.uuid,
                reactor_handle,
                broker_handle: &mut self.broker_handle,
            };
            link.handle_message(reactor_ctx, msg)?;
        }
    
        // the handling link may now emit a domestic message, which will
        // be received by the reactor core and all other links.

        // for example, suppose a game client sends a "command" message,
        // which contains an input json. The link could receive the message,
        // parse the json, and if correct output a "move" event, which can
        // then update the game state residing in the 'core' type.
        // The core handler can then again emit a 'game state changed' event,
        // which the link handlers can pick up on, and forward to their remote
        // parties (the game clients).
        self.handle_internal_queue();
        return Ok(());
    }

    fn handle_internal_queue(&mut self) {
        while let Some(message) = self.message_queue.pop_front() {
            let msg = message.reader().expect("invalid message");
            if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
                let mut ctx = CoreCtx {
                    reactor_handle: ReactorHandle {
                        message_queue: &mut self.message_queue,
                    },
                    state: &mut self.internal_state,
                };

                handler.handle(&mut ctx, msg.get_payload())
                    .expect("handler failed");
                // todo: what should happen with this error?
            }
        }
    }
}


struct Link<S> {
    /// Uuid of remote party
    remote_uuid: Uuid,
    /// handler state
    state: S,
    /// handle internal messages (sent by core, or other link handlers)
    internal_handlers: HandlerMap<S, (), capnp::Error>,
    /// handle external messages (sent by remote party)
    external_handlers: HandlerMap<S, (), capnp::Error>,
}

struct ReactorCtx<'a> {
    uuid: &'a Uuid,
    reactor_handle: ReactorHandle<'a>,
    broker_handle: &'a mut mpsc::UnboundedSender<Message>,
}

struct HandlerCtx<'a, S> {
    uuid: &'a Uuid,
    remote_uuid: &'a Uuid,
    broker_handle: &'a mut mpsc::UnboundedSender<Message>,
    reactor_handle: ReactorHandle<'a>,
    state: &'a mut S,
}

struct CoreCtx<'a, S> {
    reactor_handle: ReactorHandle<'a>,
    state: &'a mut S,
}

type CoreHandler<S, T, E> = Box<
    for <'a> Handler<'a, CoreCtx<'a, S>, any_pointer::Owned, Output=T, Error=E>
>;

type LinkHandler<S, T, E> = Box<
    for <'a> Handler<'a, HandlerCtx<'a, S>, any_pointer::Owned, Output=T, Error=E>
>;

type HandlerMap<S, T, E> = HashMap<u64, LinkHandler<S, T, E>>;

type BoxedLink = Box<LinkTrait>;

trait LinkTrait {
    fn handle_message<'a>(&mut self, ReactorCtx<'a>, mozaic_message::Reader<'a>)
        -> Result<(), capnp::Error>;
}

impl<S> LinkTrait for Link<S> {
    fn handle_message<'a>(
        &mut self,
        ctx: ReactorCtx<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&msg.get_type_id()) {

            let mut handler_ctx = HandlerCtx {
                uuid: ctx.uuid,
                remote_uuid: &self.remote_uuid,
                broker_handle: ctx.broker_handle,
                reactor_handle: ctx.reactor_handle,
                state: &mut self.state,
            };
            handler.handle(&mut handler_ctx, msg.get_payload())?
        }
        return Ok(());
    }
}