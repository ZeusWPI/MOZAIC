use super::runtime::Broker;
use super::reactor::*;
use capnp;
use core_capnp::{terminate_stream, initialize, send_greeting, greeting};
use super::types::*;

use futures::{Future, Async};
use futures::future::poll_fn;

use tokio::runtime::Runtime;

use rand::Rng;

pub fn run() {
    // Create the runtime
    let mut rt = Runtime::new().unwrap();
    
    let mut broker = Broker::new();
    rt.spawn(poll_fn(move || {
        let main = Main {};
        let uuid = rand::thread_rng().gen();
        broker.spawn(uuid, main.params());
        return Ok(Async::Ready(()));
    }));

    // // Wait until the runtime becomes idle and shut it down.
    rt.shutdown_on_idle().wait().unwrap();
}


struct Main {}

impl Main {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, FnHandler::new(Self::initialize));
        return params;
    }

    fn initialize<C: Ctx>(
        self: &mut ReactorCtx<Self, C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        let greeter = Greeter { to_greet: self.handle().uuid().clone() };
        let greeter_uuid = self.handle().spawn(greeter.params());
        let link = GreeterLink {};
        self.handle().open_link(link.params(greeter_uuid));
        return Ok(());
    }
}


struct Greeter {
    to_greet: Uuid,
}

impl Greeter {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, CtxHandler::new(Self::initialize));
        return params;
    }

    fn initialize<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        let link = (GreeterLink {}).params(self.to_greet.clone());
        handle.open_link(link);

        handle.send_internal(send_greeting::Owned, |b| {
            let mut greeting: send_greeting::Builder = b.init_as();
            greeting.set_message("Hey friend!");
        });

        return Ok(());
    }
}

struct Link<'a, H> {
    state: &'a mut GreeterLinkState,
    core_state: &'a Greeter,
    handle: &'a mut H,
}


struct GreeterLinkState {}

struct GreeterLink { }

impl GreeterLink {
    fn params<C: Ctx>(self, foreign_uuid: Uuid) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_uuid, self);
        params.internal_handler(
            send_greeting::Owned,
            CtxHandler::new(Self::send_greeting)
        );
        params.external_handler(
            greeting::Owned,
            CtxHandler::new(Self::recv_greeting),
        );
        params.external_handler(
            terminate_stream::Owned,
            CtxHandler::new(Self::close_handler),
        );
        return params;
    }

    fn send_greeting<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        send_greeting: send_greeting::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = send_greeting.get_message()?;

        handle.send_message(greeting::Owned, |b| {
            let mut greeting: greeting::Builder = b.init_as();
            greeting.set_message(message);
        });

        return Ok(());
    }

    fn recv_greeting<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        greeting: greeting::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = greeting.get_message()?;
        println!("got greeting: {:?}", message);
        handle.close_link();
        return Ok(());
    }

    fn close_handler<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        _: terminate_stream::Reader,
    ) -> Result<(), capnp::Error>
    {
        // also close our end of the stream
        handle.close_link();
        return Ok(());
    }
}
