use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

use events;
use network::connection::Connection;
use super::event_wire::{EventWire, EventWireEvent};
use super::reactor::*;

pub struct ClientReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,

    event_wire: EventWire,
}

impl<S> ClientReactor<S> {
    pub fn new(reactor: Reactor<S>, connection: Connection)
        -> (ClientReactorHandle, Self)
    {
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();

        let reactor = ClientReactor {
            reactor,
            ctrl_chan,
            event_wire: EventWire::new(connection),
        };

        let handle = ClientReactorHandle {
            inner: ctrl_handle,
        };

        return (handle, reactor);
    }

    pub fn poll_control_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(event) => {
                    self.event_wire.send(event.as_wire_event());
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
                    self.reactor.handle_wire_event(&event);
                }
                EventWireEvent::Connected => {
                    let event_box = EventBox::new(events::FollowerConnected {});
                    self.reactor.handle_event(&event_box);
                }
                EventWireEvent::Disconnected => {
                    let event_box = EventBox::new(events::FollowerDisconnected {});
                    self.reactor.handle_event(&event_box);
                }
            }
        }
    }
}

impl<S> Future for ClientReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match try!(self.poll_control_channel()) {
            Async::Ready(()) => self.event_wire.poll_complete(),
            Async::NotReady =>  self.poll_event_wire(),
        }
    }
}

pub struct ClientReactorHandle {
    inner: mpsc::UnboundedSender<Box<AnyEvent>>,
}

impl ClientReactorHandle {
    pub fn dispatch_event<T>(&mut self, event: T)
        where T: EventType + Send + 'static
    {
        let event_box = EventBox::wrap(event);
        self.inner.unbounded_send(event_box)
            .expect("control channel broke");
    }
}