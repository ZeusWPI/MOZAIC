use std::collections::{HashMap, VecDeque};
use super::{AnyPtrHandler, Handler};
use super::broker::BrokerHandle;
use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, Owned};
use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc;

use rand;
use rand::Rng;

use capnp::message;

use core_capnp;
use core_capnp::{mozaic_message, terminate_stream};

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


fn set_uuid<'a>(mut builder: core_capnp::uuid::Builder<'a>, uuid: &Uuid) {
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
    raw_reader: message::Reader<VecSegment>,
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
    fn from_capnp<S>(reader: message::Reader<S>) -> Self
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

    fn from_segment(segment: VecSegment) -> Self {
        Message {
            raw_reader: message::Reader::new(
                segment,
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

pub struct ReactorParams<S, C> {
    pub uuid: Uuid,
    pub core_params: CoreParams<S>,
    pub links: Vec<Box<LinkParamsTrait<C>>>,
}

pub trait ReactorSpawner: 'static + Send {
    fn reactor_uuid<'a>(&'a self) -> &'a Uuid;
    fn spawn_reactor(
        self: Box<Self>,
        broker_handle: BrokerHandle,
    ) -> mpsc::UnboundedSender<Message>;
}

impl<S, C> ReactorSpawner for ReactorParams<S, C>
    where S: 'static + Send,
          C: Ctx + 'static
{
    fn reactor_uuid<'a>(&'a self) -> &'a Uuid {
        &self.uuid
    }

    fn spawn_reactor(
        self: Box<Self>,
        broker_handle: BrokerHandle,
    ) -> mpsc::UnboundedSender<Message>
    {
        let params = *self;
        unimplemented!()

        // let (handle, reactor) = Reactor::new(broker_handle, params);
        // tokio::spawn(reactor);
        // return handle;
    }
}

pub struct CoreParams<S> {
    pub state: S,
    pub handlers: HashMap<u64, CoreHandler<S, (), capnp::Error>>,
}

impl<S> CoreParams<S> {
    pub fn handler<M, H>(&mut self, m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a> Handler<'a, CoreCtx<'a, S>, M, Output=(), Error=capnp::Error>,

    {
        let boxed = Box::new(AnyPtrHandler::new(h));
        self.handlers.insert(
            <M as Owned<'static>>::Reader::type_id(),
            boxed,
        );
    }
}

pub struct LinkParams<S, C: Ctx> {
    pub remote_uuid: Uuid,
    pub state: S,
    pub internal_handlers: LinkHandlers<S, C, (), capnp::Error>,
    pub external_handlers: LinkHandlers<S, C, (), capnp::Error>,
}

impl<S, C: Ctx> LinkParams<S, C> {
    pub fn new(remote_uuid: Uuid, state: S) -> Self {
        LinkParams {
            remote_uuid,
            state,
            internal_handlers: HashMap::new(),
            external_handlers: HashMap::new(),
        }
    }

    pub fn internal_handler<M, H>(&mut self, _m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a> Handler<'a, LinkCtx<'a, S, C>, M, Output=(), Error=capnp::Error>,
    {
        let boxed = Box::new(AnyPtrHandler::new(h));
        self.internal_handlers.insert(
            <M as Owned<'static>>::Reader::type_id(),
            boxed,
        );

    }

    pub fn external_handler<M, H>(&mut self, _m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a> Handler<'a, LinkCtx<'a, S, C>, M, Output=(), Error=capnp::Error>,
    {
        let boxed = Box::new(AnyPtrHandler::new(h));
        self.external_handlers.insert(
            <M as Owned<'static>>::Reader::type_id(),
            boxed,
        );
    }
}

pub trait LinkParamsTrait<C: Ctx>: 'static + Send {
    fn remote_uuid<'a>(&'a self) -> &'a Uuid;
    fn into_link(self: Box<Self>) -> Link<C>;
}

impl<S, C> LinkParamsTrait<C> for LinkParams<S, C>
    where S: 'static + Send,
          C: Ctx + 'static
{
    fn remote_uuid<'a>(&'a self) -> &'a Uuid {
        &self.remote_uuid
    }

    fn into_link(self: Box<Self>) -> Link<C> {
        let unboxed = *self;

        let link_state = LinkState {
            remote_uuid: unboxed.remote_uuid,
            local_closed: false,
            remote_closed: false,
        };

        let reducer = LinkReducer {
            state: unboxed.state,
            internal_handlers: unboxed.internal_handlers,
            external_handlers: unboxed.external_handlers,
        };

        return Link {
            reducer: Box::new(reducer),
            link_state,
        };
    }
}

pub trait Ctx: for<'a> Context<'a> {}

pub trait Context<'a> {
    type ReactorHandle: for<'b> ReaktorHandle<'b>;
    type LinkHandle: LinkHandle;
}

pub trait ReaktorHandle<'b> {
    type LinkHandle: LinkHandle;

    fn link_handle(&'b mut self, &'b mut LinkState) -> Self::LinkHandle;
}

pub struct SimpleReactorHandle<'a> {
    msg_queue: &'a mut VecDeque<Message>,
}

impl<'a, 'b> ReaktorHandle<'b> for SimpleReactorHandle<'a> {
    type LinkHandle = SimpleLinkHandle<'b>;

    fn link_handle(&'b mut self, link_state: &'b mut LinkState)
        -> Self::LinkHandle
    {
        SimpleLinkHandle {
            link_state,
            msg_queue: self.msg_queue,
        }
    }
}

pub struct SimpleLinkHandle<'a> {
    link_state: &'a mut LinkState,
    msg_queue: &'a mut VecDeque<Message>,
}

impl<'a> LinkHandle for SimpleLinkHandle<'a> {
    fn send_remote(&mut self, msg: Message) {
        unimplemented!()
    }

    fn send_core(&mut self, msg: Message) {
        unimplemented!()
    }

    fn close(&mut self) {
        unimplemented!()
    }
}

pub struct RouterHandle {}

pub struct SimpleReactorDriver<S> {
    pub message_chan: mpsc::UnboundedReceiver<Message>,
    pub message_queue: VecDeque<Message>,
    pub router_handle: RouterHandle,

    pub reactor: Reactor<S, SimpleReactorDriver<S>>,
}

impl<'a, S> Context<'a> for SimpleReactorDriver<S> {
    type ReactorHandle = SimpleReactorHandle<'a>;
    type LinkHandle = SimpleLinkHandle<'a>;
}

impl<S> Ctx for SimpleReactorDriver<S> {}

impl<S: 'static> SimpleReactorDriver<S> {
    fn handle_message(&mut self, msg: Message) {
        let mut reactor_handle = SimpleReactorHandle {
            msg_queue: &mut self.message_queue,
        };

        self.reactor.handle_external_message(&mut reactor_handle, msg)
            .expect("invalid message");
    }
}


// TODO: can we partition the state so that borrowing can be easier?
// eg group uuid, broker_handle, message_queue
pub struct Reactor<S, C> {
    pub uuid: Uuid,
    pub internal_state: S,
    pub internal_handlers: HashMap<u64, CoreHandler<S, (), capnp::Error>>,
    pub links: HashMap<Uuid, Link<C>>,
}

impl<S, C> Reactor<S, C>
    where C: Ctx + 'static
{
    pub fn new(
        broker_handle: BrokerHandle,
        params: ReactorParams<S, C>
    ) -> (mpsc::UnboundedSender<Message>, Self)
    {
        let (snd, recv) = mpsc::unbounded();

        let links = params.links.into_iter().map(|link_params| {
            let uuid = link_params.remote_uuid().clone();
            let link = link_params.into_link();
            return (uuid, link);
        }).collect();

        let reactor = Reactor {
            uuid: params.uuid,
            internal_state: params.core_params.state,
            internal_handlers: params.core_params.handlers,
            links,
        };

        return (snd, reactor);
    }

    // receive a foreign message and send it to the appropriate
    // immigration bureau
    fn handle_external_message<'a>(
        &'a mut self,
        reactor_handle: &'a mut <C as Context<'a>>::ReactorHandle,
        message: Message
    ) -> Result<(), capnp::Error>
    {
        let msg = message.reader()?;
        let sender_uuid = msg.get_sender()?.into();
        let closed = {
            let link = self.links.get_mut(&sender_uuid)
                .expect("no link with message sender");

            // link.handle_external(reactor_handle, msg)?;

            // link.link_state.local_closed && link.link_state.remote_closed
            false
        };

        if closed {
            self.links.remove(&sender_uuid);
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
        // self.handle_internal_queue();
        return Ok(());
    }

    // TODO

    // fn handle_internal_queue(&mut self) {
    //     while let Some(message) = self.message_queue.pop_front() {
    //         let msg = message.reader().expect("invalid message");
    //         if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
    //             let mut ctx = CoreCtx {
    //                 reactor_handle: ReactorHandle {
    //                     uuid: &self.uuid,
    //                     message_queue: &mut self.message_queue,
    //                 },
    //                 state: &mut self.internal_state,
    //             };

    //             handler.handle(&mut ctx, msg.get_payload())
    //                 .expect("handler failed");
    //             // todo: what should happen with this error?
    //         }
    //     }
    // }
}

pub struct ReactorCtx<'a, C> {
    uuid: &'a Uuid,
    reactor_handle: ReactorHandle<'a>,
    context_handle: &'a mut C,
}


pub struct CoreCtx<'a, S> {
    pub reactor_handle: ReactorHandle<'a>,
    state: &'a mut S,
}

// TODO: is this the right name for this?
/// for sending messages inside the reactor
pub struct ReactorHandle<'a> {
    pub uuid: &'a Uuid,
    pub message_queue: &'a mut VecDeque<Message>,
}

impl<'a> ReactorHandle<'a> {
    // TODO: should this be part of some trait?
    pub fn send_message<M, F>(&mut self, _m: M, initializer: F)
        where F: for<'b> FnOnce(capnp::any_pointer::Builder<'b>),
              M: Owned<'static>,
              <M as Owned<'static>>::Builder: HasTypeId,

    {
        // TODO: oh help, dupe. Isn't this kind of incidental, though?
        // the values that are set on the message do differ, only in uuids
        // now, but they will differ more once timestamps and ids get added.
        let mut message_builder = ::capnp::message::Builder::new_default();
        {
            let mut msg = message_builder.init_root::<mozaic_message::Builder>();

            set_uuid(msg.reborrow().init_sender(), self.uuid);
            set_uuid(msg.reborrow().init_receiver(), self.uuid);

            msg.set_type_id(<M as Owned<'static>>::Builder::type_id());
            {
                let payload_builder = msg.reborrow().init_payload();
                initializer(payload_builder);
            }
        }

        let message = Message::from_capnp(message_builder.into_reader());
        self.message_queue.push_back(message);
    }
}


/// for sending messages to other actors
pub struct Sender<'a, C> {
    pub uuid: &'a Uuid,
    pub remote_uuid: &'a Uuid,
    pub link_state: &'a mut LinkState,
    pub context_handle: &'a mut C,
}


impl<'a, C> Sender<'a, C>
    where C: Ctx
{
    pub fn send_message<M, F>(&mut self, _m: M, initializer: F)
        where F: for<'b> FnOnce(capnp::any_pointer::Builder<'b>),
              M: Owned<'static>,
              <M as Owned<'static>>::Builder: HasTypeId,
    {
        let mut message_builder = ::capnp::message::Builder::new_default();
        {
            let mut msg = message_builder.init_root::<mozaic_message::Builder>();

            set_uuid(msg.reborrow().init_sender(), self.uuid);
            set_uuid(msg.reborrow().init_receiver(), self.remote_uuid);

            msg.set_type_id(<M as Owned<'static>>::Builder::type_id());
            {
                let payload_builder = msg.reborrow().init_payload();
                initializer(payload_builder);
            }
        }

        let msg = Message::from_capnp(message_builder.into_reader());
        unimplemented!()
        // self.context_handle.dispatch_external(msg);
    }

    pub fn close(&mut self) {
        if self.link_state.local_closed {
            return;
        }

        self.send_message(terminate_stream::Owned, |b| {
            b.init_as::<terminate_stream::Builder>();
        });

        self.link_state.local_closed = true;
    }
}

type CoreHandler<S, T, E> = Box<
    for <'a> Handler<'a, CoreCtx<'a, S>, any_pointer::Owned, Output=T, Error=E>
>;


// ********** LINKS **********

pub trait LinkHandle {
    fn send_remote(&mut self, msg: Message);
    fn send_core(&mut self, msg: Message);
    fn close(&mut self);
}

pub struct LinkCtx<'a, S, C: Ctx> {
    state: &'a mut S,
    handle: &'a mut <C as Context<'a>>::LinkHandle,
}

type LinkHandler<S, C, T, E> = Box<
    for <'a> Handler<'a, LinkCtx<'a, S, C>, any_pointer::Owned, Output=T, Error=E>
>;

type LinkHandlers<S, C, T, E> = HashMap<u64, LinkHandler<S, C, T, E>>;


pub struct LinkState {
    /// Uuid of remote party
    // this is not really state, but putting it in here is awfully convenient
    pub remote_uuid: Uuid,

    pub local_closed: bool,
    pub remote_closed: bool,
}

pub struct Link<C> {
    pub reducer: Box<LinkReducerTrait<C>>,

    pub link_state: LinkState,
}

impl<C> Link<C>
    where C: Ctx + 'static
{
    fn handle_external<'a, 'b: 'a>(
        &'a mut self,
        handle: &'a mut <C as Context<'a>>::ReactorHandle,
        msg: mozaic_message::Reader<'a>
    ) -> Result<(), capnp::Error>
    {
        if msg.get_type_id() == terminate_stream::Reader::type_id() {
            self.link_state.remote_closed = true;
        }

        let mut link_handle = handle.link_handle(&mut self.link_state);
        return self.reducer.handle_external(&mut link_handle, msg);
    }

    fn handle_internal<'a>(
        &mut self,
        ctx: ReactorCtx<'a, C>,
        msg: mozaic_message::Reader<'a>
    ) -> Result<(), capnp::Error>
    {
        // let sender = Sender {
        //     uuid: ctx.uuid,
        //     remote_uuid: &self.remote_uuid,
        //     context_handle: ctx.context_handle,
        //     link_state: &mut self.link_state,
        // };
        unimplemented!()
        // return self.reducer.handle_internal(ctx.reactor_handle, sender, msg);
    }

}

pub struct LinkReducer<S, C>
    where C: Ctx
{
    /// handler state
    pub state: S,
    /// handle internal messages (sent by core, or other link handlers)
    pub internal_handlers: LinkHandlers<S, C, (), capnp::Error>,
    /// handle external messages (sent by remote party)
    pub external_handlers: LinkHandlers<S, C, (), capnp::Error>,
}

pub trait LinkReducerTrait<C: Ctx>: 'static + Send {
    fn handle_external<'a>(
        &mut self,
        link_handle: &'a mut <C as Context<'a>>::LinkHandle,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

    fn handle_internal<'a>(
        &mut self,
        link_handle: &'a mut <C as Context<'a>>::LinkHandle,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

}

impl<S, C> LinkReducerTrait<C> for LinkReducer<S, C>
    where S: 'static + Send,
          C: 'static + Ctx,
{
    fn handle_external<'a>(
        &mut self,
        link_handle: &'a mut <C as Context<'a>>::LinkHandle,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&msg.get_type_id()) {
            let mut ctx = LinkCtx {
                state: &mut self.state,
                handle: unimplemented!(),
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }

    fn handle_internal<'a>(
        &mut self,
        link_handle: &'a mut <C as Context<'a>>::LinkHandle,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
            let mut ctx = LinkCtx {
                state: &mut self.state,
                handle: unimplemented!(),
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }
}
