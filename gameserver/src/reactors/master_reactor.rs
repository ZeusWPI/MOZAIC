use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use std::time::Instant;

use events;
use network::connection::Connection;
use utils::delay_heap::DelayHeap;
use super::event_wire::{EventWire, EventWireEvent};
use super::reactor::*;

/// The MasterReactor is in charge of running a match - that is, it runs the
/// game rules and should have control over the ClientReactors that serve
/// the clients associated with the match.
/// It will forward all processed events over an EventWire to a client-side
/// reactor, that can then observe match progress.
/// The client can also send events over the wire, which will then get
/// 'dispatched' to the reactor.
pub struct MasterReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<ReactorCommand>,
    
    event_wire: EventWire,

    delayed_events: DelayHeap<Box<AnyEvent>>,
}

impl<S> MasterReactor<S> {
    pub fn new(reactor: Reactor<S>,
               ctrl_chan: mpsc::UnboundedReceiver<ReactorCommand>,
               connection: Connection) -> Self
    {
        MasterReactor {
            ctrl_chan,
            event_wire: EventWire::new(connection),
            reactor,
            delayed_events: DelayHeap::new(),
        }
    }

    fn poll_control_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(ReactorCommand::Emit { event }) => {
                    self.handle_event(event.as_ref());
                }
                Some(ReactorCommand::EmitDelayed { event, instant }) => {
                    self.delayed_events.push(instant, event);
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

    fn poll_delayed(&mut self) -> Poll<(), ()> {
        loop {
            let event = try_ready!(self.delayed_events.poll());
            self.handle_event(event.as_ref());
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

impl<S> Future for MasterReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        // Note that the order of these statements is important!

        // TODO: this could be done better
        match try!(self.poll_control_channel()) {
            Async::Ready(()) => return self.event_wire.poll_complete(),
            Async::NotReady =>  {}
        };
        try!(self.poll_delayed());
        try!(self.poll_event_wire());
        return Ok(Async::NotReady);
    }
}

pub enum ReactorCommand {
    Emit {
        event: Box<AnyEvent>,
    },
    EmitDelayed {
        event: Box<AnyEvent>,
        instant: Instant,
    },
}


#[derive(Clone)]
pub struct MasterReactorHandle {
    inner: mpsc::UnboundedSender<ReactorCommand>,
}


impl MasterReactorHandle {
    pub fn new(handle: mpsc::UnboundedSender<ReactorCommand>) -> Self {
        MasterReactorHandle {
            inner: handle,
        }
    }

    pub fn dispatch_event<T>(&mut self, event: T)
        where T: EventType + Send + 'static
    {
        self.send_command(ReactorCommand::Emit {
            event: EventBox::wrap(event),
        });
    }

    pub fn emit_delayed<T>(&mut self, instant: Instant, event: T)
        where T: EventType + Send + 'static
    {
        self.send_command(ReactorCommand::EmitDelayed {
            event: EventBox::wrap(event),
            instant,
        });
    }

    fn send_command(&mut self, command: ReactorCommand) {
        self.inner.unbounded_send(command)
            .expect("event channel broke");
    }   
}
