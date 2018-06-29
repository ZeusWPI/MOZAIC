use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

use network::connection::Connection;
use super::event_channel::EventChannel;
use super::reactor::*;


pub struct CoreReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    
    event_channel: EventChannel,
}

impl<S> CoreReactor<S> {
    pub fn new(reactor: Reactor<S>,
               ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
               connection: Connection) -> Self {

        CoreReactor {
            ctrl_chan,
            event_channel: EventChannel::new(connection),
            reactor,
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
