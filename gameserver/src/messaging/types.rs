use std::marker::PhantomData;

use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, Owned};


/// Handles messages of type M with lifetime 'a, using state S.
pub trait Handler<'a, S, M>: Send
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
    message_type: PhantomData<M>,
    function: F,
}

impl<M, F> FnHandler<M, F> {
    pub fn new(function: F) -> Self {
        FnHandler {
            function,
            message_type: PhantomData,
        }
    }

    pub fn typed(_m: M, function: F) -> Self {
        Self::new(function)
    }
}

impl<'a, S, M, F, T, E> Handler<'a, S, M> for FnHandler<M, F>
    where F: Fn(&mut S, <M as Owned<'a>>::Reader) -> Result<T, E>,
          F: Send,
          M: Owned<'a> + 'static + Send
{
    type Output = T;
    type Error = E;

    fn handle(&self, state: &mut S, reader: <M as Owned<'a>>::Reader)
        -> Result<T, E>
    {
        (self.function)(state, reader)
    }
}


/// Given a handler H for message type M, constructs a new handler that will
/// interpret an AnyPointer as M, and then pass it to H.
pub struct AnyPtrHandler<H, M> {
    message_type: PhantomData<M>,
    handler: H,
}

impl<H, M> AnyPtrHandler<H, M> {
    pub fn new(handler: H) -> Self {
        AnyPtrHandler {
            handler,
            message_type: PhantomData,
        }
    }
}

impl<'a, S, M, H> Handler<'a, S, any_pointer::Owned> for AnyPtrHandler<H, M>
    where H: Handler<'a, S, M>,
          H::Error: From<capnp::Error>,
          M: Send + Owned<'a>
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



