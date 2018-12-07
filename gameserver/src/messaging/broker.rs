use std::collections::HashMap;
use futures::sync::mpsc;
use futures::{Future, Stream, Poll};

use super::reactor::{Uuid, Message, ReactorParams, Reactor};

pub struct Broker {
    recv: mpsc::UnboundedReceiver<Message>,
    snd: mpsc::UnboundedSender<Message>,
    actors: HashMap<Uuid, mpsc::UnboundedSender<Message>>,
}

impl Broker {
    pub fn new() -> Self {
        let (snd, recv) = mpsc::unbounded();

        Broker {
            recv,
            snd,
            actors: HashMap::new(),
        }
    }

    pub fn get_handle(&self) -> mpsc::UnboundedSender<Message> {
        self.snd.clone()
    }

    pub fn add_actor(&mut self, uuid: Uuid, snd: mpsc::UnboundedSender<Message>)
    {
        self.actors.insert(uuid, snd);
    }

    pub fn spawn<S>(&mut self, params: ReactorParams<S>)
        where S: 'static + Send
    {
        let handle = self.get_handle();
        let uuid = params.uuid.clone();
        let (reactor_handle, reactor) = Reactor::new(handle, params);
        self.actors.insert(uuid, reactor_handle);
        tokio::spawn(reactor);
    }

    fn route_messages(&mut self) -> Poll<(), ()> {
        loop {
            // unwrapping is fine because we hold a handle
            let msg = try_ready!(self.recv.poll()).unwrap();
            self.route_message(msg).unwrap();
        }
    }

    fn route_message(&mut self, message: Message)
        -> Result<(), capnp::Error>
    {
        let chan = {
            let msg = message.reader()?;
            let receiver_uuid = msg.get_receiver()?.into();
            let chan = self.actors.get_mut(&receiver_uuid)
                .expect("unknown receiver");
            chan
        };
        chan.unbounded_send(message).unwrap();
        return Ok(());
    }
}

impl Future for Broker {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        self.route_messages()
    }
}