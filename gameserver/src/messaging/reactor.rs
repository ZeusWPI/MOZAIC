use std::collections::{HashMap, VecDeque};
use super::HandlerSet;
use capnp;

#[derive(PartialEq, Eq, Hash)]
struct Uuid {
    pub x0: u64,
    pub x1: u64,
}

// stub message type, this should be repalced
struct Message<'a> {
    sender_id: Uuid,
    type_id: u64,
    data: capnp::any_pointer::Reader<'a>
}

struct Reactor<S> {
    core: Core<S>,
    links: HashMap<Uuid, BoxedLink>,
}

impl<S> Reactor<S> {
    // receive a foreign message and send it to the appropriate
    // immigration bureau
    fn handle_message<'a>(&mut self, message: Message<'a>) {
        let link = self.links.get_mut(&message.sender_id)
            .expect("no link with message sender");
        link.handle_message(message)
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
    handlers: HandlerSet<S, (), capnp::Error>,
}


struct Link<S> {
    /// handler state
    state: S,
    /// handle internal messages (sent by core, or other link handlers)
    internal_handlers: HandlerSet<S, (), capnp::Error>,
    /// handle external messages (sent by remote party)
    external_handlers: HandlerSet<S, (), capnp::Error>,
}

type BoxedLink = Box<LinkTrait>;

trait LinkTrait {
    fn handle_message<'a>(&mut self, message: Message<'a>)
        -> Result<(), capnp::Error>;
}

impl<S> LinkTrait for Link<S> {
    fn handle_message<'a>(&mut self, message: Message<'a>)
        -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.handler(message.type_id) {
            handler.handle(&mut self.state, message.data)?
        }
        return Ok(());
    }
}