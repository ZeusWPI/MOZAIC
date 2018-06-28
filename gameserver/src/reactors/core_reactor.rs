use bytes::BytesMut;
use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use protocol as proto;
use prost::Message;

use network::connection::{Connection, ConnectionEvent};
use super::event_channel::EventChannel;
use super::reactor::*;


pub struct CoreReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    ctrl_handle: mpsc::UnboundedSender<Box<AnyEvent>>,
    
    event_channel: EventChannel,
}

impl<S> CoreReactor<S> {
    pub fn new(reactor: Reactor<S>, connection: Connection) -> Self {
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();

        CoreReactor {
            ctrl_handle,
            ctrl_chan,
            event_channel: EventChannel::new(connection),
            reactor,
        }
    }

    fn handle(&self) -> ReactorHandle {
        ReactorHandle {
            event_channel: self.ctrl_handle.clone(),
        }
    }

    fn poll_control_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(event) => {
                    self.handle_event(SomeEvent::Event(event));
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn poll_event_channel(&mut self) -> Poll<(), ()> {
        loop {
            let some_event = try_ready!(self.event_channel.poll());
            self.handle_event(some_event);
        }
    }

    fn handle_event(&mut self, event: SomeEvent) {
        self.reactor.handle(&event);
        // Send the event after handling it, so that the receiver can be
        // certain that the reactor has already handled it.
        self.event_channel.send_event(event);
    }
}

impl<S> Future for CoreReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        try!(self.poll_control_channel());
        try!(self.poll_event_channel());
        return Ok(Async::NotReady);
    }
}


pub struct ReactorHandle {
    event_channel: mpsc::UnboundedSender<Box<AnyEvent>>,
}

impl ReactorHandle {
    fn dispatch_event<T>(&mut self, event: T)
        where T: EventType + Send + 'static
    {
        let event_box = EventBox::wrap(event);
        self.event_channel.unbounded_send(event_box)
            .expect("event channel broke");
    }
}
