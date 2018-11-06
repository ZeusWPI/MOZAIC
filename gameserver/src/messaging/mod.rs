use std::collections::HashMap;

use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};
use core_capnp::{message, greet_person};

use std::marker::PhantomData;

pub struct MessageHandler<S, R> {
    state: S,
    handlers: HashMap<
        u64,
        Box<for <'a> Handler<'a, S, any_pointer::Owned, Output=R>>
    >,
}

impl<S, R> MessageHandler<S, R> {
    pub fn new(state: S) -> Self {
        MessageHandler {
            state,
            handlers: HashMap::new(),
        }
    }

    pub fn add_handler<M, H>(&mut self, handler: H)
        where H: for <'a> Handler<'a, S, M, Output=R> + Sized + 'static,
              M: for <'a> Owned<'a> + 'static,
              <M as Owned<'static>>::Reader: HasTypeId,
    {
        let type_id = <M as Owned<'static>>::Reader::type_id();

        let any_ptr_handler = AnyPtrHandler::new(handler);
        self.handlers.insert(type_id, Box::new(any_ptr_handler));
    }

    pub fn handle_message<'a>(&mut self, message: message::Reader<'a>)
        -> Option<R>
    {
        let type_id = message.get_type_id();
        let state = &mut self.state;
        return self.handlers.get(&type_id).map(|handler| {
            handler.handle(state, message.get_data())
        });
    }
}

/// Given a handler H for message type M, constructs a new handler that will
/// interpret an AnyPointer as M, and then call H on it.
pub struct AnyPtrHandler<H, M> {
    message_type: PhantomData<M>,
    handler: H,
}

impl<H, M> AnyPtrHandler<H, M> {
    fn new(handler: H) -> Self {
        AnyPtrHandler {
            handler,
            phantom_m: PhantomData,
        }
    }
}

impl<'a, S, M, H> Handler<'a, S, any_pointer::Owned> for AnyPtrHandler<H, M>
    where H: Handler<'a, S, M>,
          M: Owned<'a>
{
    type Output = H::Output;

    fn handle(&self, state: &mut S, reader: any_pointer::Reader<'a>)
        -> H::Output
    {
        // TODO: how can we propagate this error?
        let m = reader.get_as().expect("downcast failed");
        return self.handler.handle(state, m);
    }
}

/// Handles messages of the given type and lifetime with the given state. 
pub trait Handler<'a, S, M>
    where M: Owned<'a>
{
    type Output;

    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader)
        -> Self::Output;
}

/// Ties a handler function to a message type
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

impl<'a, S, M, F, R> Handler<'a, S, M> for FnHandler<M, F>
    where F: Fn(&mut S, <M as Owned<'a>>::Reader) -> R,
          M: Owned<'a>
{
    type Output = R;

    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader) -> R {
        (self.function)(state, reader)
    }
}


// ********** TEST **********

struct GreeterState {}

impl GreeterState {
    fn greet<'a>(&mut self, reader: greet_person::Reader<'a>) {
        println!("hello {}!", reader.get_person_name().unwrap());
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
