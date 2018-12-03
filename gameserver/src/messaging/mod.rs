use std::collections::HashMap;

use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};
use core_capnp::{message, greet_person};

use std::marker::PhantomData;

pub mod broker;
pub mod reactor;
pub mod test;

pub struct HandlerSet<S, T, E> {
    handler_map: HashMap<u64, BoxedHandler<S, T, E>>,
}

impl<S, T, E> HandlerSet<S, T, E> {
    pub fn new() -> Self {
        HandlerSet {
            handler_map: HashMap::new(),
        }
    }

    pub fn insert<M, H>(&mut self, handler: H)
        where H: for <'a> Handler<'a, S, M, Output=T, Error=E>,
              H: Sized + 'static,
              E: From<capnp::Error>,
              M: for <'a> Owned<'a> + 'static,
              <M as Owned<'static>>::Reader: HasTypeId,
    {
        let type_id = <M as Owned<'static>>::Reader::type_id();

        let any_ptr_handler = AnyPtrHandler::new(handler);
        self.handler_map.insert(type_id, Box::new(any_ptr_handler));
    }

    pub fn handler<'a>(&'a self, type_id: u64)
        -> Option<&'a BoxedHandler<S, T, E>>
    {
        self.handler_map.get(&type_id)
    }
}

pub struct MessageHandler<S, T, E> {
    state: S,
    handlers: HashMap<u64, BoxedHandler<S, T, E>>,
}

type BoxedHandler<S, T, E> = Box<
    for<'a> Handler<'a, S, any_pointer::Owned, Output=T, Error=E>
>;

impl<S, T, E> MessageHandler<S, T, E> {
    pub fn new(state: S) -> Self {
        MessageHandler {
            state,
            handlers: HashMap::new(),
        }
    }

    pub fn add_handler<M, H>(&mut self, handler: H)
        where H: for <'a> Handler<'a, S, M, Output=T, Error=E>,
              H: Sized + 'static,
              E: From<capnp::Error>,
              M: for <'a> Owned<'a> + 'static,
              <M as Owned<'static>>::Reader: HasTypeId,
    {
        let type_id = <M as Owned<'static>>::Reader::type_id();

        let any_ptr_handler = AnyPtrHandler::new(handler);
        self.handlers.insert(type_id, Box::new(any_ptr_handler));
    }

    pub fn handle_message<'a>(&mut self, message: message::Reader<'a>)
        -> Option<Result<T, E>>
    {
        let type_id = message.get_type_id();
        let state = &mut self.state;
        return self.handlers.get(&type_id).map(|handler| {
            handler.handle(state, message.get_data())
        });
    }
}

/// Given a handler H for message type M, constructs a new handler that will
/// interpret an AnyPointer as M, and then pass it to H.
pub struct AnyPtrHandler<H, M> {
    message_type: PhantomData<M>,
    handler: H,
}

impl<H, M> AnyPtrHandler<H, M> {
    fn new(handler: H) -> Self {
        AnyPtrHandler {
            handler,
            message_type: PhantomData,
        }
    }
}

impl<'a, S, M, H> Handler<'a, S, any_pointer::Owned> for AnyPtrHandler<H, M>
    where H: Handler<'a, S, M>,
          H::Error: From<capnp::Error>,
          M: Owned<'a>
{
    type Output = H::Output;
    type Error = H::Error;

    fn handle(&self, state: &mut S, reader: any_pointer::Reader<'a>)
        -> Result<H::Output, H::Error>
    {
        let m = reader.get_as()?;
        return self.handler.handle(state, m);
    }
}

/// Handles messages of type M with lifetime 'a, using state S.
pub trait Handler<'a, S, M>
    where M: Owned<'a>
{
    type Output;
    type Error;

    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader)
        -> Result<Self::Output, Self::Error>;
}

/// Ties a handler function to a message type.
/// This coupling is required because a capnp reader type has a lifetime
/// parameter (for the buffer it refers to), and we want handlers to work
/// for any such lifetime parameter. This is achieved through the capnp
/// Owned<'a> trait, which M implements for all 'a. Through an associated
/// type on that trait, Reader<'a> is coupled.
/// Refer to the Handler implementation for FnHandler to see how this works.
pub struct FnHandler<M, F> {
    message_type: M,
    function: F,
}

impl<M, F> FnHandler<M, F> {
    pub fn new(message_type: M, function: F) -> Self {
        FnHandler {
            function,
            message_type,
        }
    }
}

impl<'a, S, M, F, T, E> Handler<'a, S, M> for FnHandler<M, F>
    where F: Fn(&mut S, <M as Owned<'a>>::Reader) -> Result<T, E>,
          M: Owned<'a>
{
    type Output = T;
    type Error = E;

    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader)
        -> Result<T, E>
    {
        (self.function)(state, reader)
    }
}


// ********** TEST **********
// TOOD

struct GreeterState {}

impl GreeterState {
    fn greet<'a>(&mut self, reader: greet_person::Reader<'a>)
        -> Result<(), capnp::Error>
    {
        println!("hello {}!", reader.get_person_name()?);
        return Ok(());
    }
}

pub fn test() {
    let mut msg_handler = MessageHandler::new(GreeterState {});

    let handler = FnHandler::new(greet_person::Owned, GreeterState::greet);
    msg_handler.add_handler(handler);

    // construct a message
    let mut message_builder = ::capnp::message::Builder::new_default();
    let mut message = message_builder.init_root::<message::Builder>();

    {
        message.set_type_id(greet_person::Builder::type_id());
        let mut greet_person = message
            .reborrow()
            .init_data()
            .init_as::<greet_person::Builder>();
        greet_person.set_person_name("bob");
    }

    // feed it into the handler
    msg_handler.handle_message(message.as_reader());
}
