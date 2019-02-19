use std::marker::PhantomData;

use rand;
use rand::Rng;

use capnp;
use capnp::any_pointer;
use capnp::traits::Owned;
use core_capnp;
use core_capnp::mozaic_message;


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



#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Uuid {
    pub x0: u64,
    pub x1: u64,
}

impl rand::distributions::Distribution<Uuid> for rand::distributions::Standard {
    fn sample<G: Rng + ?Sized>(&self, rng: &mut G) -> Uuid {
        Uuid {
            x0: rng.gen(),
            x1: rng.gen(),
        }
    }
}


pub fn set_uuid<'a>(mut builder: core_capnp::uuid::Builder<'a>, uuid: &Uuid) {
    builder.set_x0(uuid.x0);
    builder.set_x1(uuid.x1);
}

impl <'a> From<core_capnp::uuid::Reader<'a>> for Uuid {
    fn from(reader: core_capnp::uuid::Reader<'a>) -> Uuid {
        Uuid {
            x0: reader.get_x0(),
            x1: reader.get_x1(),
        }
    }
}

// TODO: it might be nice to make a message a reference-counted byte array,
// analogous to the Bytes type. On construction, it could be canonicalized
// and signed, then "frozen", just like Bytes. After that, it could easily be
// passed around the system.
pub struct Message {
    raw_reader: capnp::message::Reader<VecSegment>,
}

pub struct VecSegment {
    words: Vec<capnp::Word>,
}

impl VecSegment {
    pub fn new(words: Vec<capnp::Word>) -> Self {
        VecSegment {
            words,
        }
    }
}

impl capnp::message::ReaderSegments for VecSegment {
    fn get_segment<'a>(&'a self, idx: u32) -> Option<&'a [capnp::Word]> {
        if idx == 0 {
            return Some(&self.words);
        } else {
            return None;
        }
    }

    fn len(&self) -> usize {
        self.words.len()
    }
}

impl Message {
    pub fn from_capnp<S>(reader: capnp::message::Reader<S>) -> Self
        where S: capnp::message::ReaderSegments
    {
        let words = reader.canonicalize().unwrap();
        let segment = VecSegment::new(words);
        return Message {
            raw_reader: capnp::message::Reader::new(
                segment,
                capnp::message::ReaderOptions::default(),
            )
        };
    }

    pub fn from_segment(segment: VecSegment) -> Self {
        Message {
            raw_reader: capnp::message::Reader::new(
                segment,
                capnp::message::ReaderOptions::default(),
            ),
        }
    }

    pub fn reader<'a>(&'a self)
        -> Result<mozaic_message::Reader<'a>, capnp::Error>
    {
        return self.raw_reader.get_root();
    }

    pub fn bytes<'a>(&'a self) -> &'a [u8] {
        // todo: errors or something
        self.raw_reader.get_root().unwrap()
    }
}