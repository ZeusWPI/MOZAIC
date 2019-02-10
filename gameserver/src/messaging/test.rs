use std::collections::{VecDeque, HashMap};

use super::runtime::Broker;
use super::reactor;
use super::reactor::*;
use capnp;
use capnp::traits::HasTypeId;
use core_capnp::{terminate_stream, initialize, greet_person};
use super::{AnyPtrHandler, FnHandler};

use futures::{Future, Async};
use futures::future::poll_fn;

use tokio::runtime::Runtime;

pub fn run() {
    // Create the runtime
    let mut rt = Runtime::new().unwrap();

    
    let mut broker = Broker::new();
    rt.spawn(poll_fn(move || {
        let mut params = CoreParams::new(CoreState {});
        params.handler(initialize::Owned, FnHandler::new(init_1));
        broker.spawn(params);
        return Ok(Async::Ready(()));
    }));

    // // Wait until the runtime becomes idle and shut it down.
    rt.shutdown_on_idle().wait().unwrap();
}


struct CoreState {}

fn greet_person_handler<C: Ctx>(
    _state: &mut ReactorCtx<CoreState, C>,
    reader: greet_person::Reader,
) -> Result<(), capnp::Error>
{
    println!("hello {}!", reader.get_person_name()?);
    return Ok(());
}

struct LinkState {}

fn init_1<C: Ctx>(
    ctx: &mut HandlerCtx<CoreState, ReactorHandle<C>>,
    reader: initialize::Reader,
) -> Result<(), capnp::Error>
{
    println!("Initialized {:?}!", ctx.handle().uuid);
    let mut params = CoreParams::new(CoreState {});
    params.handler(initialize::Owned, FnHandler::new(init_2));
    ctx.handle().spawn(params);
    return Ok(());
}

fn init_2<C: Ctx>(
    ctx: &mut HandlerCtx<CoreState, ReactorHandle<C>>,
    reader: initialize::Reader,
) -> Result<(), capnp::Error>
{
    println!("Initialized {:?}!", ctx.handle().uuid);
    return Ok(());
}

fn receive_greet<C: Ctx>(
    ctx: &mut HandlerCtx<LinkState, LinkHandle<C>>,
    reader: greet_person::Reader,
) -> Result<(), capnp::Error>
{
    ctx.handle().send_message(greet_person::Owned, |b| {
        let mut greeting: greet_person::Builder = b.init_as();
        greeting.set_person_name(reader.get_person_name().unwrap());
    });
    return Ok(());
}

fn close<S, C: Ctx>(
    ctx: &mut HandlerCtx<S, LinkHandle<C>>,
    _: terminate_stream::Reader,
) -> Result<(), capnp::Error>
{
    ctx.handle().close_link();
    return Ok(());
}
