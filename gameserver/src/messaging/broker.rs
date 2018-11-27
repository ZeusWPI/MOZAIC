use std::collections::HashMap;
use futures::sync::mpsc;
use futures::{Future, Stream, Poll};

use super::reactor::{Uuid, Message};

pub struct Broker {
    recv: mpsc::UnboundedReceiver<Message>,
    snd: mpsc::UnboundedSender<Message>,
    actors: HashMap<Uuid, mpsc::UnboundedSender<Message>>,
}

impl Broker {
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
        chan.unbounded_send(message);
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