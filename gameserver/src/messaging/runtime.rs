use std::collections::VecDeque;

use tokio;
use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc;

use super::*;
use super::reactor::*;


struct ReactorDriver<S: 'static> {
    message_chan: mpsc::UnboundedReceiver<Message>,
    internal_queue: VecDeque<Message>,

    reactor: Reactor<S, ReactorDriver<S>>,
}

impl<S: 'static> ReactorDriver<S> {
    fn handle_external_message(&mut self, message: Message) {
        let mut handle = DriverHandle {
            internal_queue: &mut self.internal_queue,
        };
        self.reactor.handle_external_message(&mut handle, message)
            .expect("handling failed");
    }

    fn handle_internal_queue(&mut self) {
        while let Some(message) = self.internal_queue.pop_front() {
            let mut handle = DriverHandle {
                internal_queue: &mut self.internal_queue,
            };
            self.reactor.handle_internal_message(&mut handle, message)
                .expect("handling failed");
        }
    }
}

impl<'a, S> Context<'a> for ReactorDriver<S> {
    type Handle = DriverHandle<'a>;
}

struct DriverHandle<'a> {
    internal_queue: &'a mut VecDeque<Message>,
}

impl<'a> CtxHandle for DriverHandle<'a> {
    fn dispatch_internal(&mut self, msg: Message) {
        self.internal_queue.push_back(msg);
    }

    fn dispatch_external(&mut self, msg: Message) {
        unimplemented!()
    }
}
