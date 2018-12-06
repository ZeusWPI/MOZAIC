use std::collections::{VecDeque, HashMap};

use super::broker::Broker;
use super::reactor::*;
use capnp;
use capnp::traits::HasTypeId;
use core_capnp::greet_person;
use super::{AnyPtrHandler, FnHandler};

use futures::Future;
use futures::sync::mpsc;

use tokio::runtime::Runtime;

pub fn run() {
    // Create the runtime
    let mut rt = Runtime::new().unwrap();

    let (reactor_snd, reactor_recv) = mpsc::unbounded();

    let reactor_uuid = Uuid {
        x0: 8,
        x1: 8,
    };

    let remote_uuid = Uuid {
        x0: 8,
        x1: 9,
    };

    let mut broker = Broker::new();

    let mut reactor = Reactor {
        uuid: reactor_uuid.clone(),
        message_chan: reactor_recv,
        broker_handle: broker.get_handle(),
        message_queue: VecDeque::new(),
        internal_state: CoreState {},
        internal_handlers: HashMap::new(),
        links: HashMap::new(),
    };

    let h = FnHandler::new(greet_person::Owned, greet_person_handler);
    reactor.internal_handlers.insert(
        greet_person::Reader::type_id(),
        Box::new(AnyPtrHandler::new(h)),
    );

    let mut link = Link {
        remote_uuid: remote_uuid.clone(),
        state: LinkState {},
        internal_handlers: HashMap::new(),
        external_handlers: HashMap::new(),
    };

    let h2 = FnHandler::new(greet_person::Owned, receive_greet);
    link.external_handlers.insert(
        greet_person::Reader::type_id(),
        Box::new(AnyPtrHandler::new(h2)),
    );

    reactor.links.insert(link.remote_uuid.clone(), Box::new(link));
    
    broker.add_actor(reactor.uuid.clone(), reactor_snd);
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