use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};

use core_capnp::initialize;

use tokio;
use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc;

use rand;
use rand::Rng;

use super::*;
use super::reactor::*;

pub struct Runtime;

pub struct Broker {
    actors: HashMap<Uuid, ActorData>,
}

impl Broker {
    pub fn new() -> BrokerHandle {
        let broker = Broker { actors: HashMap::new() };
        return BrokerHandle { broker: Arc::new(Mutex::new(broker)) };
    }
}

pub struct ActorData {
    tx: mpsc::UnboundedSender<Message>,
}

#[derive(Clone)]
pub struct BrokerHandle {
    broker: Arc<Mutex<Broker>>,
}

impl BrokerHandle {
    pub fn dispatch_message(&mut self, message: Message) {
        let mut broker = self.broker.lock().unwrap();
        let receiver_uuid = message.reader()
            .unwrap()
            .get_receiver()
            .unwrap()
            .into();

        if let Some(receiver) = broker.actors.get_mut(&receiver_uuid) {
            receiver.tx.unbounded_send(message)
                .expect("send failed");
        } else {
            panic!("no such actor: {:?}", receiver_uuid);
        }
    }

    pub fn register(&mut self, uuid: Uuid, tx: mpsc::UnboundedSender<Message>) {
        let mut broker = self.broker.lock().unwrap();
        broker.actors.insert(uuid, ActorData { tx });
    }

    pub fn spawn<S>(&mut self, core_params: CoreParams<S, Runtime>)
        -> Uuid
        where S: 'static + Send
    {
        let mut broker = self.broker.lock().unwrap();

        let mut rng = rand::thread_rng();
        let uuid: Uuid = rng.gen();

        let reactor = Reactor {
            uuid: uuid.clone(),
            internal_state: core_params.state,
            internal_handlers: core_params.handlers,
            links: HashMap::new(),
        };

        let (tx, rx) = mpsc::unbounded();

        broker.actors.insert(uuid.clone(), ActorData { tx });

        let mut driver = ReactorDriver {
            broker: self.clone(),
            internal_queue: VecDeque::new(),
            message_chan: rx,
            reactor,
        };
        {
            let mut ctx_handle = DriverHandle {
                broker: &mut driver.broker,
                internal_queue: &mut driver.internal_queue,
            };

            let mut reactor_handle: ReactorHandle<Runtime> = ReactorHandle {
                uuid: &driver.reactor.uuid,
                ctx: &mut ctx_handle,
            };

            reactor_handle.send_internal(initialize::Owned, |b| {
                b.init_as::<initialize::Builder>();
            });
        }

        tokio::spawn(driver);
        return uuid;
    }
}


enum InternalOp {
    Message(Message),
    OpenLink(Box<LinkParamsTrait<Runtime>>),
    CloseLink(Uuid),
}


pub struct ReactorDriver<S: 'static> {
    message_chan: mpsc::UnboundedReceiver<Message>,
    internal_queue: VecDeque<InternalOp>,
    broker: BrokerHandle,

    reactor: Reactor<S, Runtime>,
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
        while let Some(op) = self.internal_queue.pop_front() {
            match op {
                InternalOp::Message(msg) => {
                    let mut handle = DriverHandle {
                        internal_queue: &mut self.internal_queue,
                        broker: &mut self.broker,
                    };
                    self.reactor.handle_internal_message(&mut handle, msg)
                        .expect("handling failed");
                }
                InternalOp::OpenLink(params) => {
                    let uuid = params.remote_uuid().clone();
                    let link = params.into_link();
                    self.reactor.links.insert(uuid, link);
                }
                InternalOp::CloseLink(_uuid) => {
                    // TODO
                }
            }
        }
    }

    fn handle_links(&mut self) {

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

impl<'a> Context<'a> for Runtime {
    type Handle = DriverHandle<'a>;
}

pub struct DriverHandle<'a> {
    internal_queue: &'a mut VecDeque<InternalOp>,
    broker: &'a mut BrokerHandle,
}

impl<'a> CtxHandle<Runtime> for DriverHandle<'a> {

    fn dispatch_internal(&mut self, msg: Message) {
        self.internal_queue.push_back(InternalOp::Message(msg));
    }

    fn dispatch_external(&mut self, msg: Message) {
        self.broker.dispatch_message(msg);
    }

    fn spawn<T>(&mut self, params: CoreParams<T, Runtime>) -> Uuid
        where T: 'static + Send
    {
        self.broker.spawn(params)
    }

    fn open_link<T>(&mut self, params: LinkParams<T, Runtime>)
        where T: 'static + Send
    {
        self.internal_queue.push_back(InternalOp::OpenLink(Box::new(params)));
    }
}
