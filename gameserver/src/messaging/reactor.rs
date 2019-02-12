use std::collections::HashMap;
use super::types::*;
use capnp;
use capnp::any_pointer;
use capnp::traits::{HasTypeId, Owned};

use core_capnp::{mozaic_message, terminate_stream};

pub struct Reactor<S, C: Ctx> {
    pub uuid: Uuid,
    pub internal_state: S,
    pub internal_handlers: HashMap<u64, CoreHandler<S, C, (), capnp::Error>>,
    pub links: HashMap<Uuid, Link<C>>,
}

impl<S, C: Ctx> Reactor<S, C> {
    // receive a foreign message and send it to the appropriate
    // immigration bureau
    pub fn handle_external_message<'a, 'c: 'a>(
        &'a mut self,
        ctx_handle: &'a mut <C as Context<'c>>::Handle,
        message: Message,
    ) -> Result<(), capnp::Error>
    {
        let msg = message.reader()?;
        let sender_uuid = msg.get_sender()?.into();

        let closed = {
            let link = self.links.get_mut(&sender_uuid)
                .expect("no link with message sender");

            let mut reactor_handle = ReactorHandle {
                uuid: &self.uuid,
                ctx: ctx_handle,
            };

            link.handle_external(&mut reactor_handle, msg)?;

            link.link_state.local_closed && link.link_state.remote_closed
        };

        if closed {
            ctx_handle.close_link(&sender_uuid);
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
        return Ok(());
    }

    pub fn handle_internal_message<'c>(
        &mut self,
        ctx_handle: &mut <C as Context<'c>>::Handle,
        message: Message,
    ) -> Result<(), capnp::Error>
    {
        let msg = message.reader()?;

        if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
            let mut reactor_handle = ReactorHandle {
                uuid: &self.uuid,
                ctx: ctx_handle,
            };


            let mut handler_ctx = HandlerCtx {
                state: &mut self.internal_state,
                handle: &mut reactor_handle,
            };

            handler.handle(&mut handler_ctx, msg.get_payload())?;
        }

        for link in self.links.values_mut() {
            let mut reactor_handle = ReactorHandle {
                uuid: &self.uuid,
                ctx: ctx_handle,
            };

            link.handle_internal(&mut reactor_handle, msg)?;
        }

        return Ok(());
    }
}

pub struct LinkState {
    pub local_closed: bool,
    pub remote_closed: bool,
}

pub struct Link<C> {
    pub remote_uuid: Uuid,

    pub reducer: Box<LinkReducerTrait<C>>,

    pub link_state: LinkState,
}

impl<C> Link<C>
    where C: Ctx
{
    fn handle_external(
        &mut self,
        handle: &mut ReactorHandle<C>,
        msg: mozaic_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        if msg.get_type_id() == terminate_stream::Reader::type_id() {
            self.link_state.remote_closed = true;
        }

        let mut link_handle = handle
            .link_handle(&self.remote_uuid, &mut self.link_state);
        return self.reducer.handle_external(&mut link_handle, msg);
    }

    fn handle_internal(
        &mut self,
        handle: &mut ReactorHandle<C>,
        msg: mozaic_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let mut link_handle = handle
            .link_handle(&self.remote_uuid, &mut self.link_state);
        return self.reducer.handle_internal(&mut link_handle, msg);
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
    fn handle_external<'a, 'b, >(
        &'a mut self,
        link_handle: &'a mut LinkHandle<'a, '_, C>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

    fn handle_internal<'a>(
        &'a mut self,
        link_handle: &'a mut LinkHandle<'a, '_, C>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>;

}

impl<S, C> LinkReducerTrait<C> for LinkReducer<S, C>
    where S: 'static + Send,
          C: 'static + Ctx,
{
    fn handle_external<'a>(
        &'a mut self,
        link_handle: &'a mut LinkHandle<'a, '_, C>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.external_handlers.get(&msg.get_type_id()) {
            let mut ctx = HandlerCtx {
                state: &mut self.state,
                handle: link_handle,
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }

    fn handle_internal<'a>(
        &'a mut self,
        link_handle: &'a mut LinkHandle<'a, '_, C>,
        msg: mozaic_message::Reader<'a>,
    ) -> Result<(), capnp::Error>
    {
        if let Some(handler) = self.internal_handlers.get(&msg.get_type_id()) {
            let mut ctx = HandlerCtx {
                state: &mut self.state,
                handle: link_handle,
            };
            handler.handle(&mut ctx, msg.get_payload())?
        }
        return Ok(());
    }
}

pub trait Ctx : 'static + for<'a> Context<'a> {}
impl<C> Ctx for C where C: 'static + for<'a> Context<'a> {}

pub trait Context<'a> : Sized {
    type Handle: 'a + CtxHandle<Self>;
}

pub trait CtxHandle<C> {
    fn dispatch_internal(&mut self, message: Message);
    fn dispatch_external(&mut self, message: Message);

    fn open_link<S>(&mut self, params: LinkParams<S, C>)
        where S: 'static + Send,
              C: Ctx;
    
    fn close_link(&mut self, uuid: &Uuid);


    fn spawn<S>(&mut self, params: CoreParams<S, C>) -> Uuid
        where S: 'static + Send,
              C: Ctx;
}

// TODO: make fields private
pub struct ReactorHandle<'a, 'c: 'a, C: Ctx> {
    pub uuid: &'a Uuid,
    pub ctx: &'a mut <C as Context<'c>>::Handle,
}

impl<'a, 'c, C: Ctx> ReactorHandle<'a, 'c, C> {
    fn link_handle<'b>(
        &'b mut self,
        remote_uuid: &'b Uuid,
        link_state: &'b mut LinkState
    ) -> LinkHandle<'b, 'c, C>
    {
        LinkHandle {
            uuid: self.uuid,
            ctx: self.ctx,
            link_state,
            remote_uuid,
        }
    }

    pub fn send_internal<M, F>(&mut self, _m: M, initializer: F)
        where F: for<'b> FnOnce(capnp::any_pointer::Builder<'b>),
              M: Owned<'static>,
              <M as Owned<'static>>::Builder: HasTypeId,
    {
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

        let msg = Message::from_capnp(message_builder.into_reader());
        self.ctx.dispatch_internal(msg);
    }

    pub fn spawn<S>(&mut self, params: CoreParams<S, C>) -> Uuid
        where S: 'static + Send
    {
        self.ctx.spawn(params)
    }

    pub fn open_link<S>(&mut self, params: LinkParams<S, C>)
        where S: 'static + Send
    {
        self.ctx.open_link(params);
    }
}

pub struct LinkHandle<'a, 'c: 'a, C: Ctx> {
    pub uuid: &'a Uuid,
    pub remote_uuid: &'a Uuid,
    link_state: &'a mut LinkState,
    ctx: &'a mut <C as Context<'c>>::Handle,
}

impl<'a, 'c, C: Ctx> LinkHandle<'a, 'c, C> {
    pub fn send_internal<M, F>(&mut self, _m: M, initializer: F)
        where F: for<'b> FnOnce(capnp::any_pointer::Builder<'b>),
              M: Owned<'static>,
              <M as Owned<'static>>::Builder: HasTypeId,
    {
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

        let msg = Message::from_capnp(message_builder.into_reader());
        self.ctx.dispatch_internal(msg);
    }

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
        self.ctx.dispatch_external(msg);
    }

    pub fn close_link(&mut self) {
        if self.link_state.local_closed {
            return;
        }

        self.send_message(terminate_stream::Owned, |b| {
            b.init_as::<terminate_stream::Builder>();
        });

        self.link_state.local_closed = true;
    }
}


pub struct HandlerCtx<'a, S, H> {
    state: &'a mut S,
    handle: &'a mut H,
}

impl<'a, S, H> HandlerCtx<'a, S, H> {
    pub fn state<'b>(&'b mut self) -> &'b mut S {
        &mut self.state
    }

    pub fn handle<'b>(&'b mut self) -> &'b mut H {
        &mut self.handle
    }

    pub fn split<'b>(&'b mut self) -> (&'b mut S, &'b mut H) {
        (&mut self.state, &mut self.handle)
    }
}


pub type ReactorCtx<'a, 'c, S, C> = HandlerCtx<'a, S, ReactorHandle<'a, 'c, C>>;
pub type LinkCtx<'a, 'c, S, C> = HandlerCtx<'a, S, LinkHandle<'a, 'c, C>>;

use std::ops::Deref;

impl<'a, S, H> Deref for HandlerCtx<'a, S, H> {
    type Target = S;

    fn deref(&self) -> &S {
        &self.state
    }
}



type CoreHandler<S, C, T, E> = Box<
    for <'a, 'c>
        Handler<
            'a,
            HandlerCtx<'a, S, ReactorHandle<'a, 'c, C>>,
            any_pointer::Owned,
            Output=T,
            Error=E
        >
>;

type LinkHandler<S, C, T, E> = Box<
    for<'a, 'c>
        Handler<'a,
            HandlerCtx<'a, S, LinkHandle<'a, 'c, C>>,
            any_pointer::Owned,
            Output=T,
            Error=E
        >
>;

type LinkHandlers<S, C, T, E> = HashMap<u64, LinkHandler<S, C, T, E>>;







// *********** SPAWNING **********




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
pub struct CoreParams<S, C: Ctx> {
    pub state: S,
    pub handlers: HashMap<u64, CoreHandler<S, C, (), capnp::Error>>,
}

impl<S, C: Ctx> CoreParams<S, C> {
    pub fn new(state: S) -> Self {
        CoreParams {
            state,
            handlers: HashMap::new(),
        }
    }

    pub fn handler<M, H>(&mut self, m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a, 'c> Handler<'a, HandlerCtx<'a, S, ReactorHandle<'a, 'c, C>>, M, Output=(), Error=capnp::Error>,
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
              H: 'static + for <'a, 'c> Handler<'a, HandlerCtx<'a, S, LinkHandle<'a, 'c, C>>, M, Output=(), Error=capnp::Error>
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
              H: 'static + for <'a, 'c> Handler<'a, HandlerCtx<'a, S, LinkHandle<'a, 'c, C>>, M, Output=(), Error=capnp::Error>
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
