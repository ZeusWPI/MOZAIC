use std::collections::HashMap;

use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, FromPointerReader, Owned};
use core_capnp::{message, greet_person};

use std::marker::PhantomData;

trait AnyPointerHandler<'a, S> {
    fn handle_any_pointer(&self, &mut S, any_pointer::Reader<'a>);
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
    fn new(function: F) -> Self {
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

impl<'a, S, M, F> AnyPointerHandler<'a, S> for FnHandler<M, F>
    where F: Fn(&mut S, <M as Owned<'a>>::Reader),
          M: Owned<'a>
{
    fn handle_any_pointer(&self, state: &mut S, reader: any_pointer::Reader<'a>) {
        let m = reader.get_as().expect("downcast failed");
        self.handle(state, m);
    }
}

fn test_bound<T>(t: T)
    where T: for <'a> AnyPointerHandler<'a, GreeterState>
{
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

    let reader = message.as_reader();
    
    let mut state = GreeterState {};
    t.handle_any_pointer(&mut state, reader.get_data());
}


struct GreeterState {}

impl GreeterState {
    fn greet<'a>(&mut self, reader: greet_person::Reader<'a>) {
        println!("hello {}!", reader.get_person_name().unwrap());
    }
}


pub fn test() {
    let b: FnHandler<greet_person::Owned, _> = FnHandler::new(GreeterState::greet);
    test_bound(b);
}
