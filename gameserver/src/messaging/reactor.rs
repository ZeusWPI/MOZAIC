use std::collections::{HashMap, VecDeque};
use super::Handler;
use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};

use capnp::message;

use core_capnp::message as mozaic_message;

#[derive(PartialEq, Eq, Hash)]
struct Uuid {
    pub x0: u64,
    pub x1: u64,
}

// stub message type, this should be repalced
struct Message {
    sender_id: Uuid,
    type_id: u64,
    data: capnp::serialize::OwnedSegments,
}


struct Reactor<S> {
    message_queue: VecDeque<Message>,
    core: Core<S>,
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
    fn handle_external_message(&mut self, message: Message) {
        let link = self.links.get_mut(&message.sender_id)
            .expect("no link with message sender");

        let reactor_handle = ReactorHandle {
            message_queue: &mut self.message_queue,
        };
        link.handle_message(reactor_handle, message)
            .expect("yo that message was not valid");
        // the handling link may now emit a domestic message, which will
        // be received by the reactor core and all other links.

        // for example, suppose a game client sends a "command" message,
        // which contains an input json. The link could receive the message,
        // parse the json, and if correct output a "move" event, which can
        // then update the game state residing in the 'core' type.
        // The core handler can then again emit a 'game state changed' event,
        // which the link handlers can pick up on, and forward to their remote
        // parties (the game clients).
    }
}

// TODO
struct Core<S> {
    state: S,
    handlers: HandlerMap<S, (), capnp::Error>,
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
    // TODO: wrap this queue into a neat api
    reactor_handle: ReactorHandle<'a>,
    state: &'a mut S,
}

type LinkHandler<S, T, E> = Box<
    for <'a> Handler<'a, HandlerCtx<'a, S>, any_pointer::Owned, Output=T, Error=E>
>;

type HandlerMap<S, T, E> = HashMap<u64, LinkHandler<S, T, E>>;

type BoxedLink = Box<LinkTrait>;

trait LinkTrait {
    fn handle_message<'a>(&mut self, h: ReactorHandle<'a>, message: Message)
        -> Result<(), capnp::Error>;
}

impl<S> LinkTrait for Link<S> {
    fn handle_message<'a> (&mut self, h: ReactorHandle<'a>, message: Message)
        -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&message.type_id) {
            let message_reader = message::Reader::new(
                message.data,
                message::ReaderOptions::default(),
            );
            let msg: mozaic_message::Reader = message_reader.get_root()?;

            let mut ctx = HandlerCtx {
                reactor_handle: h,
                state: &mut self.state,
            };
            handler.handle(&mut ctx, msg.get_data())?
        }
        return Ok(());
    }
}