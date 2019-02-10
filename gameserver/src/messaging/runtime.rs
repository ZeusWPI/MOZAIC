use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};

use tokio;
use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc;

use super::*;
use super::reactor::*;

struct Broker {
    actors: HashMap<Uuid, ActorData>,
}

impl Broker {
    fn new() -> BrokerHandle {
        let broker = Broker { actors: HashMap::new() };
        return BrokerHandle { broker: Arc::new(Mutex::new(broker)) };
    }
}

struct ActorData {
    tx: mpsc::UnboundedSender<Message>,
}

#[derive(Clone)]
struct BrokerHandle {
    broker: Arc<Mutex<Broker>>,
}

impl BrokerHandle {
    fn dispatch_message(&mut self, message: Message) {
        let mut broker = self.broker.lock().unwrap();
        let receiver_uuid = message.reader()
            .unwrap()
            .get_receiver()
            .unwrap()
            .into();

        if let Some(receiver) = broker.actors.get_mut(&receiver_uuid) {
            receiver.tx.unbounded_send(message);
        } else {
            panic!("no such actor: {:?}", receiver_uuid);
        }
    }

    fn register(&mut self, uuid: Uuid, tx: mpsc::UnboundedSender<Message>) {
        let mut broker = self.broker.lock().unwrap();
        broker.actors.insert(uuid, ActorData { tx });
    }
}


struct ReactorDriver<S: 'static> {
    message_chan: mpsc::UnboundedReceiver<Message>,
    internal_queue: VecDeque<Message>,
    broker: BrokerHandle,

    reactor: Reactor<S, ReactorDriver<S>>,
}

impl<S: 'static> ReactorDriver<S> {
    fn handle_external_message(&mut self, message: Message) {
        let mut handle = DriverHandle {
            internal_queue: &mut self.internal_queue,
            broker: &mut self.broker,
        };
        self.reactor.handle_external_message(&mut handle, message)
            .expect("handling failed");
    }

    fn handle_internal_queue(&mut self) {
        while let Some(message) = self.internal_queue.pop_front() {
            let mut handle = DriverHandle {
                internal_queue: &mut self.internal_queue,
                broker: &mut self.broker,
            };
            self.reactor.handle_internal_message(&mut handle, message)
                .expect("handling failed");
        }
    }
}

impl<S: 'static> Future for ReactorDriver<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            self.handle_internal_queue();
            match try_ready!(self.message_chan.poll()) {
                None => return Ok(Async::Ready(())),
                Some(message) => {
                    self.handle_external_message(message);
                }
            }
        }
    }
}

impl<'a, S> Context<'a> for ReactorDriver<S> {
    type Handle = DriverHandle<'a>;
}

struct DriverHandle<'a> {
    internal_queue: &'a mut VecDeque<Message>,
    broker: &'a mut BrokerHandle,
}

impl<'a> CtxHandle for DriverHandle<'a> {
    fn dispatch_internal(&mut self, msg: Message) {
        self.internal_queue.push_back(msg);
    }

    fn dispatch_external(&mut self, msg: Message) {
        self.broker.dispatch_message(msg);
    }
}
