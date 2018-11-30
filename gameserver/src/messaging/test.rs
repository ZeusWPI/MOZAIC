use std::collections::{VecDeque, HashMap};

use super::broker::Broker;
use super::reactor::{Uuid, Reactor};

use futures::sync::mpsc;

pub fn run() {
    let (broker_snd, broker_recv) = mpsc::unbounded();
    let (reactor_snd, reactor_recv) = mpsc::unbounded();

    let reactor = Reactor {
        uuid: Uuid {
            x0: 8,
            x1: 8,
        },
        message_chan: reactor_recv,
        broker_handle: broker_snd,
        message_queue: VecDequeue::new(),
        internal_state: CoreState,
        internal_handlers: HashMap::new(),
        links: HashMap::new(),
    }
}


struct CoreState {}
