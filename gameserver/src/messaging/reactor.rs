use std::collections::{HashMap, VecDeque};
use super::Handler;
use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};


use capnp::message;

use core_capnp;
use core_capnp::mozaic_message;

#[derive(PartialEq, Eq, Hash)]
struct Uuid {
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
struct Message {
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

    fn reader<'a>(&'a self) -> Result<mozaic_message::Reader<'a>, capnp::Error> {
        return self.raw_reader.get_root();
    }
}


struct Reactor<S> {
    message_queue: VecDeque<Message>,
    internal_state: S,
    internal_handlers: HashMap<u64, LinkHandler<S, (), capnp::Error>>;
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
            link.handle_message(reactor_handle, msg)?;
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
                let mut ctx = HandlerCtx {
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
    /// handler state
    state: S,
    /// handle internal messages (sent by core, or other link handlers)
    internal_handlers: HandlerMap<S, (), capnp::Error>,
    /// handle external messages (sent by remote party)
    external_handlers: HandlerMap<S, (), capnp::Error>,
}

struct HandlerCtx<'a, S> {
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
    fn handle_message<'a>(&mut self, ReactorHandle<'a>, mozaic_message::Reader<'a>)
        -> Result<(), capnp::Error>;
}

impl<S> LinkTrait for Link<S> {
    fn handle_message<'a>(
        &mut self,
        handle: ReactorHandle<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&msg.get_type_id()) {

            let mut ctx = HandlerCtx {
                reactor_handle: handle,
                state: &mut self.state,
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }
}