use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

use events;
use network::connection::Connection;
use super::event_wire::{EventWire, EventWireEvent};
use super::reactor::*;


pub struct CoreReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    
    event_wire: EventWire,
}

impl<S> CoreReactor<S> {
    pub fn new(reactor: Reactor<S>,
               ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
               connection: Connection) -> Self {

        CoreReactor {
            ctrl_chan,
            event_wire: EventWire::new(connection),
            reactor,
        }
    }

    fn poll_control_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(event) => {
                    self.handle_event(event.as_ref());
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn poll_event_wire(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.event_wire.poll()) {
                EventWireEvent::Event(event) => {
                    self.handle_wire_event(event);
                }
                EventWireEvent::Connected => {
                    let event_box = EventBox::new(events::LeaderConnected {});
                    self.handle_event(&event_box);
                }
                EventWireEvent::Disconnected => {
                    let event_box = EventBox::new(events::LeaderDisconnected {});
                    self.handle_event(&event_box);
                }
            }
        }
    }

    fn handle_event(&mut self, event: &AnyEvent) {
        self.reactor.handle_event(event);
        // Send the event after handling it, so that the receiver can be
        // certain that the reactor has already handled it.
        self.event_wire.send(event.as_wire_event());
    }

    fn handle_wire_event(&mut self, event: WireEvent) {
        self.reactor.handle_wire_event(&event);
        // Send the event back to the follower, so that it sees the entire
        // intact event stream in the order this reactor processed it.
        self.event_wire.send(event);
    }
}

impl<S> Future for CoreReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        try!(self.poll_control_channel());
        try!(self.poll_event_wire());
        return Ok(Async::NotReady);
    }
}


pub struct CoreReactorHandle {
    inner: mpsc::UnboundedSender<Box<AnyEvent>>,
}


impl CoreReactorHandle {
    pub fn new(handle: mpsc::UnboundedSender<Box<AnyEvent>>) -> Self {
        CoreReactorHandle {
            inner: handle,
        }
    }

    pub fn dispatch_event<T>(&mut self, event: T)
        where T: EventType + Send + 'static
    {
        let event_box = EventBox::wrap(event);
        self.inner.unbounded_send(event_box)
            .expect("event channel broke");
    }
}
