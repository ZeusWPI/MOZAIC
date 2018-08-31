use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use std::time::Instant;

use network::connection_handler::ConnectionHandle;
use utils::delay_heap::DelayHeap;
use server::ConnectionManager;


use super::types::*;
use super::ReactorCore;

/// The Reactor is in charge of running a match - that is, it runs the
/// game rules and should have control over the connections to the clients that
/// play in the match.
/// All events that happen in the reactor will be forwarded to the match owner,
/// so that it can observe the match progress and subscribe to its control
/// events.
/// This event forwarding is required functionality for the MOZAIC game setup,
/// but is not really inherent to the nature of a reactor. In the future,
/// this behaviour should be implemented in the event handler running on the
/// reactor, so that the actual reactor code will be more reusable.
pub struct Reactor<S> {
    core: ReactorCore<S>,
    ctrl_chan: mpsc::UnboundedReceiver<ReactorCommand>,
    delayed_events: DelayHeap<Box<AnyEvent>>,
    // TODO: this manager and connection should not be here ...
    connection_manager: ConnectionManager,
    match_owner: ConnectionHandle,
}

impl<S> Reactor<S> {
    pub fn new(core: ReactorCore<S>,
               match_owner: ConnectionHandle,
               connection_manager: ConnectionManager,
               ctrl_chan: mpsc::UnboundedReceiver<ReactorCommand>) -> Self
    {
        Reactor {
            ctrl_chan,
            core,
            match_owner,
            connection_manager,
            delayed_events: DelayHeap::new(),
        }
    }

    fn poll_ctrl_chan(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(ReactorCommand::Emit { event }) => {
                    self.handle_event(event.as_ref());
                }
                Some(ReactorCommand::EmitDelayed { event, instant }) => {
                    self.delayed_events.push(instant, event);
                }
                Some(ReactorCommand::Quit) => {
                    return Ok(Async::Ready(()));
                }
                None => {
                    return Ok(Async::Ready(()));
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
        self.core.handle_event(event);
        // Send the event after handling it, so that the receiver can be
        // certain that the reactor has already handled it.
        self.match_owner.send(event.as_wire_event());
    }

    fn handle_wire_event(&mut self, event: WireEvent) {
        self.core.handle_wire_event(&event);
        // Send the event back to the follower, so that it sees the entire
        // intact event stream in the order this reactor processed it.
        self.match_owner.send(event);
    }
}

impl<S> Future for Reactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        // Note that the order of these statements is important!

        // TODO: this could be done better
        match try!(self.poll_ctrl_chan()) {
            Async::Ready(()) => {
                self.connection_manager.unregister(self.match_owner.id());
                return Ok(Async::Ready(()));
            }
            Async::NotReady => {},
        };
        try!(self.poll_delayed());
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
    Quit,
}


#[derive(Clone)]
pub struct ReactorHandle {
    inner: mpsc::UnboundedSender<ReactorCommand>,
}


impl ReactorHandle {
    pub fn new(handle: mpsc::UnboundedSender<ReactorCommand>) -> Self {
        ReactorHandle {
            inner: handle,
        }
    }

    /// Dispatch an event to the reactor.
    pub fn dispatch<T>(&mut self, event: T)
        where T: Event + Send + 'static
    {
        self.send_command(ReactorCommand::Emit {
            event: EventBox::wrap(event),
        });
    }

    /// Schedule an event to be dispatched at the specified point in time.
    pub fn dispatch_at<T>(&mut self, instant: Instant, event: T)
        where T: Event + Send + 'static
    {
        self.send_command(ReactorCommand::EmitDelayed {
            event: EventBox::wrap(event),
            instant,
        });
    }

    pub fn quit(&mut self) {
        self.send_command(ReactorCommand::Quit);
    }

    fn send_command(&mut self, command: ReactorCommand) {
        self.inner.unbounded_send(command)
            .expect("event channel broke");
    }   
}
