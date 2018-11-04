use std::collections::HashMap;

use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};
use core_capnp::{message, greet_person};

use std::marker::PhantomData;

struct MessageHandler<S> {
    state: S,
    handlers: HashMap<u64, Box<for <'a> Handler<'a, S, any_pointer::Owned>>>,
}

impl<S> MessageHandler<S> {
    fn new(state: S) -> Self {
        MessageHandler {
            state,
            handlers: HashMap::new(),
        }
    }

    fn add_handler<M, H>(&mut self, handler: H)
        where H: for <'a> Handler<'a, S, M> + Sized + 'static,
              M: for <'a> Owned<'a> + 'static,
              <M as Owned<'static>>::Reader: HasTypeId,
    {
        let type_id = <M as Owned<'static>>::Reader::type_id();

        let any_ptr_handler = AnyPtrHandler::new(handler);
        self.handlers.insert(type_id, Box::new(any_ptr_handler));
    }

    fn handle_message<'a>(&mut self, message: message::Reader<'a>) {
        let type_id = message.get_type_id();
        if let Some(handler) = self.handlers.get(&type_id) {
            handler.handle(&mut self.state, message.get_data());
        }
    }
}

struct AnyPtrHandler<H, M> {
    phantom_m: PhantomData<M>,
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
    fn handle(&self, state: &mut S, reader: any_pointer::Reader<'a>) {
        let m = reader.get_as().expect("downcast failed");
        self.handler.handle(state, m);
    }
}

trait Handler<'a, S, M>
    where M: Owned<'a>
{
    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader);
}

struct FnHandler<M, F> {
    phantom_m: PhantomData<M>,
    function: F,
}

impl<M, F> FnHandler<M, F> {
    fn new(_: M, function: F) -> Self {
        FnHandler {
            function,
            phantom_m: PhantomData,
        }
    }
}

impl<'a, S, M, F> Handler<'a, S, M> for FnHandler<M, F>
    where F: Fn(&mut S, <M as Owned<'a>>::Reader),
          M: Owned<'a>
{
    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader) {
        (self.function)(state, reader)
    }
}


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
