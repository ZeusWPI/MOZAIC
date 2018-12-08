use std::collections::{HashMap, VecDeque};
use super::Handler;
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

pub struct ReactorParams<S> {
    pub uuid: Uuid,
    pub core_params: CoreParams<S>,
    pub links: Vec<Box<LinkParamsTrait>>,
}

pub trait ReactorSpawner: 'static + Send {
    fn reactor_uuid<'a>(&'a self) -> &'a Uuid;
    fn spawn_reactor(
        self: Box<Self>,
        broker_handle: BrokerHandle,
    ) -> mpsc::UnboundedSender<Message>;
}

impl<S> ReactorSpawner for ReactorParams<S>
    where S: 'static + Send
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
        let (handle, reactor) = Reactor::new(broker_handle, params);
        tokio::spawn(reactor);
        return handle;
    }
}

pub struct CoreParams<S> {
    pub state: S,
    pub handlers: HashMap<u64, CoreHandler<S, (), capnp::Error>>,
}

pub struct LinkParams<S> {
    pub remote_uuid: Uuid,
    pub state: S,
    pub internal_handlers: HandlerMap<S, (), capnp::Error>,
    pub external_handlers: HandlerMap<S, (), capnp::Error>,
}

pub trait LinkParamsTrait: 'static + Send {
    fn remote_uuid<'a>(&'a self) -> &'a Uuid;
    fn into_link(self: Box<Self>) -> Link;
}

impl<S> LinkParamsTrait for LinkParams<S>
    where S: 'static + Send
{
    fn remote_uuid<'a>(&'a self) -> &'a Uuid {
        &self.remote_uuid
    }

    fn into_link(self: Box<Self>) -> Link {
        let unboxed = *self;

        let link_state = LinkState {
            local_closed: false,
            remote_closed: false,
        };

        let reducer = LinkReducer {
            state: unboxed.state,
            internal_handlers: unboxed.internal_handlers,
            external_handlers: unboxed.external_handlers,
        };

        return Link {
            remote_uuid: unboxed.remote_uuid,
            reducer: Box::new(reducer),
            link_state,
        };
    }
}


// TODO: can we partition the state so that borrowing can be easier?
// eg group uuid, broker_handle, message_queue
pub struct Reactor<S> {
    pub uuid: Uuid,
    pub message_chan: mpsc::UnboundedReceiver<Message>,
    pub broker_handle: BrokerHandle,
    pub message_queue: VecDeque<Message>,
    pub internal_state: S,
    pub internal_handlers: HashMap<u64, CoreHandler<S, (), capnp::Error>>,
    pub links: HashMap<Uuid, Link>,
}

impl<S> Future for Reactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let res = self.receive();
        if self.links.is_empty() {
            self.broker_handle.unregister(self.uuid.clone());
            Ok(Async::Ready(()))
        } else {
            res
        }
    }
}

impl<S> Reactor<S> {
    pub fn new(
        broker_handle: BrokerHandle,
        params: ReactorParams<S>
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
            message_chan: recv,
            broker_handle,
            message_queue: VecDeque::new(),
            internal_state: params.core_params.state,
            internal_handlers: params.core_params.handlers,
            links,
        };

        return (snd, reactor);
    }

    fn receive(&mut self) -> Poll<(), ()> {
        loop {
            match  try_ready!(self.message_chan.poll()) {
                None => panic!("message channel closed"),
                Some(msg) => {
                    self.handle_external_message(msg)
                        .expect("invalid message");
                }
            }
        }
    }

    // receive a foreign message and send it to the appropriate
    // immigration bureau
    fn handle_external_message(&mut self, message: Message)
        -> Result<(), capnp::Error>
    {
        let msg = message.reader()?;
        let sender_uuid = msg.get_sender()?.into();
        let closed = {
            let link = self.links.get_mut(&sender_uuid)
                .expect("no link with message sender");

            let reactor_handle = ReactorHandle {
                uuid: &self.uuid,
                message_queue: &mut self.message_queue,
            };
            let reactor_ctx = ReactorCtx {
                uuid: &self.uuid,
                reactor_handle,
                broker_handle: &mut self.broker_handle,
            };
            link.handle_external(reactor_ctx, msg)?;

            link.link_state.local_closed && link.link_state.remote_closed
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
        self.handle_internal_queue();
        return Ok(());
    }

    fn handle_internal_queue(&mut self) {
        while let Some(message) = self.message_queue.pop_front() {
            let msg = message.reader().expect("invalid message");
            if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
                let mut ctx = CoreCtx {
                    reactor_handle: ReactorHandle {
                        uuid: &self.uuid,
                        message_queue: &mut self.message_queue,
                    },
                    links: &mut self.links,
                    state: &mut self.internal_state,
                };

                handler.handle(&mut ctx, msg.get_payload())
                    .expect("handler failed");
                // todo: what should happen with this error?
            }
        }
    }
}


pub struct Link {
    /// Uuid of remote party
    pub remote_uuid: Uuid,

    pub reducer: Box<LinkReducerTrait>,

    pub link_state: LinkState,
}

impl Link {
    fn handle_external<'a>(
        &mut self,
        ctx: ReactorCtx<'a>,
        msg: mozaic_message::Reader<'a>
    ) -> Result<(), capnp::Error>
    {
        if msg.get_type_id() == terminate_stream::Reader::type_id() {
            self.link_state.remote_closed = true;
        }

        let sender = Sender {
            uuid: ctx.uuid,
            remote_uuid: &self.remote_uuid,
            broker_handle: ctx.broker_handle,
            link_state: &mut self.link_state,
        };

        return self.reducer.handle_external(ctx.reactor_handle, sender, msg);
    }

    fn handle_internal<'a>(
        &mut self,
        ctx: ReactorCtx<'a>,
        msg: mozaic_message::Reader<'a>
    ) -> Result<(), capnp::Error>
    {
        let sender = Sender {
            uuid: ctx.uuid,
            remote_uuid: &self.remote_uuid,
            broker_handle: ctx.broker_handle,
            link_state: &mut self.link_state,
        };

        return self.reducer.handle_internal(ctx.reactor_handle, sender, msg);
    }

}

pub struct LinkReducer<S> {
    /// handler state
    pub state: S,
    /// handle internal messages (sent by core, or other link handlers)
    pub internal_handlers: HandlerMap<S, (), capnp::Error>,
    /// handle external messages (sent by remote party)
    pub external_handlers: HandlerMap<S, (), capnp::Error>,
}

pub trait LinkReducerTrait: 'static + Send {
    fn handle_external<'a>(
        &mut self,
        reactor_handle: ReactorHandle<'a>,
        sender: Sender<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

    fn handle_internal<'a>(
        &mut self,
        reactor_handle: ReactorHandle<'a>,
        sender: Sender<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

}

impl<S> LinkReducerTrait for LinkReducer<S>
    where S: 'static + Send
{
    fn handle_external<'a>(
        &mut self,
        reactor_handle: ReactorHandle<'a>,
        sender: Sender<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&msg.get_type_id()) {
            let mut ctx = HandlerCtx {
                sender,
                reactor_handle,
                state: &mut self.state,
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }

    fn handle_internal<'a>(
        &mut self,
        reactor_handle: ReactorHandle<'a>,
        sender: Sender<'a>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
            let mut ctx = HandlerCtx {
                sender,
                reactor_handle,
                state: &mut self.state,
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }
}

pub struct LinkState {
    pub local_closed: bool,
    pub remote_closed: bool,
}


pub struct ReactorCtx<'a> {
    uuid: &'a Uuid,
    reactor_handle: ReactorHandle<'a>,
    broker_handle: &'a mut BrokerHandle,
}

pub struct HandlerCtx<'a, S> {
    pub sender: Sender<'a>,
    pub reactor_handle: ReactorHandle<'a>,
    pub state: &'a mut S,
}

pub struct CoreCtx<'a, S> {
    pub reactor_handle: ReactorHandle<'a>,
    links: &'a mut HashMap<Uuid, Link>,
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
pub struct Sender<'a> {
    pub uuid: &'a Uuid,
    pub remote_uuid: &'a Uuid,
    pub link_state: &'a mut LinkState,
    pub broker_handle: &'a mut BrokerHandle,
}

impl<'a> Sender<'a> {
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
        self.broker_handle.send(msg);
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

type LinkHandler<S, T, E> = Box<
    for <'a> Handler<'a, HandlerCtx<'a, S>, any_pointer::Owned, Output=T, Error=E>
>;

type HandlerMap<S, T, E> = HashMap<u64, LinkHandler<S, T, E>>;
