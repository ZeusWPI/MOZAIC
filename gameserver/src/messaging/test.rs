use std::collections::{VecDeque, HashMap};

use super::broker::Broker;
use super::reactor::*;
use capnp;
use capnp::traits::HasTypeId;
use core_capnp::greet_person;
use super::{AnyPtrHandler, FnHandler};

use futures::Future;

use tokio::runtime::Runtime;

pub fn run() {
    // Create the runtime
    let mut rt = Runtime::new().unwrap();

    let reactor_uuid = Uuid {
        x0: 8,
        x1: 8,
    };

    let remote_uuid = Uuid {
        x0: 8,
        x1: 9,
    };

    let mut broker = Broker::new();

    let mut core_params = CoreParams {
        state: CoreState {},
        handlers: HashMap::new(),
    };

    let h = FnHandler::new(greet_person::Owned, greet_person_handler);
    core_params.handlers.insert(
        greet_person::Reader::type_id(),
        Box::new(AnyPtrHandler::new(h)),
    );

    let mut link_params = LinkParams {
        remote_uuid: remote_uuid.clone(),
        state: LinkState {},
        internal_handlers: HashMap::new(),
        external_handlers: HashMap::new(),
    };

    let h2 = FnHandler::new(greet_person::Owned, receive_greet);
    link_params.external_handlers.insert(
        greet_person::Reader::type_id(),
        Box::new(AnyPtrHandler::new(h2)),
    );

    let reactor_params = ReactorParams {
        uuid: reactor_uuid.clone(),
        core_params,
        links: vec![Box::new(link_params)],
    };

    let (handle, reactor) = Reactor::new(broker.get_handle(), reactor_params);
    broker.add_actor(reactor_uuid.clone(), handle);

    rt.spawn(reactor);

    let mut broker_handle = broker.get_handle();
    rt.spawn(broker);

    let mut test_sender = Sender {
        uuid: &remote_uuid,
        remote_uuid: &reactor_uuid,
        broker_handle: &mut broker_handle,
    };

    test_sender.send_message(greet_person::Owned, |b| {
        let mut greeting: greet_person::Builder = b.init_as();
        greeting.set_person_name("bob");
    });

    // Wait until the runtime becomes idle and shut it down.
    rt.shutdown_on_idle().wait().unwrap();
}


struct CoreState {}

fn greet_person_handler<'a>(
    _state: &mut CoreCtx<'a, CoreState>,
    reader: greet_person::Reader<'a>,
) -> Result<(), capnp::Error>
{
    println!("hello {}!", reader.get_person_name()?);
    return Ok(());
}

struct LinkState {}

fn receive_greet<'a>(
    state: &mut HandlerCtx<'a, LinkState>,
    reader: greet_person::Reader<'a>,
) -> Result<(), capnp::Error>
{
    state.reactor_handle.send_message(greet_person::Owned, |b| {
        let mut greeting: greet_person::Builder = b.init_as();
        greeting.set_person_name(reader.get_person_name().unwrap());
    });
    return Ok(());
}