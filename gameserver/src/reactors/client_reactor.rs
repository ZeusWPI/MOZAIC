use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

use network::connection::Connection;
use super::event_channel::EventChannel;
use super::reactor::*;

pub struct ClientReactor<S> {
    reactor: Reactor<S>,

    ctrl_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    ctrl_handle: mpsc::UnboundedSender<Box<AnyEvent>>,

    event_channel: EventChannel,
}

impl<S> ClientReactor<S> {
    pub fn new(reactor: Reactor<S>, connection: Connection) -> Self {
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();

        ClientReactor {
            reactor,
            ctrl_chan,
            ctrl_handle,
            event_channel: EventChannel::new(connection),
        }
    }

    pub fn handle(&self) -> ClientReactorHandle {
        ClientReactorHandle {
            inner: self.ctrl_handle.clone(),
        }
    }

    pub fn poll_control_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(event) => {
                    let e = SomeEvent::Event(event);
                    self.event_channel.send_event(e);
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    pub fn poll_event_channel(&mut self) -> Poll<(), ()> {
        loop {
            let some_event = try_ready!(self.event_channel.poll());
            self.reactor.handle(&some_event);
        }
    }
}

impl<S> Future for ClientReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        try!(self.poll_control_channel());
        try!(self.poll_event_channel());
        return Ok(Async::NotReady);
    }
}

pub struct ClientReactorHandle {
    inner: mpsc::UnboundedSender<Box<AnyEvent>>,
}

impl ClientReactorHandle {
    fn dispatch_event<T>(&mut self, event: T)
        where T: EventType + Send + 'static
    {
        let event_box = EventBox::wrap(event);
        self.inner.unbounded_send(event_box)
            .expect("control channel broke");
    }
}