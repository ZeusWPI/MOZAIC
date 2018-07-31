use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

use events;
use network::connection::Connection;
use super::event_wire::{EventWire, EventWireEvent};
use super::types::*;
use super::reactor_core::ReactorCore;

/// The ClientReactor is a reactor that follows client-side events.
/// Client-side reactors send their processed event stream over an EventWire
/// which leads to a ClientReactor. Dispatching to a ClientReactor will not
/// cause the event to be processed, but to be forwarded to the client-side over
/// the associated EventWire. Note that this construction is symetrical to the
/// MasterRecator's setup.
pub struct ClientReactor<S> {
    core: ReactorCore<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,

    event_wire: EventWire,
}

impl<S> ClientReactor<S> {
    pub fn new(core: ReactorCore<S>, connection: Connection)
        -> (ClientReactorHandle, Self)
    {
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();

        let reactor = ClientReactor {
            core,
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
                    self.core.handle_wire_event(&event);
                }
                EventWireEvent::Connected => {
                    let event_box = EventBox::new(events::FollowerConnected {});
                    self.core.handle_event(&event_box);
                }
                EventWireEvent::Disconnected => {
                    let event_box = EventBox::new(events::FollowerDisconnected {});
                    self.core.handle_event(&event_box);
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
        where T: Event + Send + 'static
    {
        let event_box = EventBox::wrap(event);
        self.inner.unbounded_send(event_box)
            .expect("control channel broke");
    }
}