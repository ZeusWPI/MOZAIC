use bytes::BytesMut;
use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use protocol as proto;
use prost::Message;
use std::any::Any;

use network::connection::{Connection, ConnectionEvent};
use super::reactor::*;


pub struct CoreReactor<S> {
    reactor: Reactor<S>,

    event_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    event_handle: mpsc::UnboundedSender<Box<AnyEvent>>,
    
    connection: Connection,
}

impl<S> CoreReactor<S> {
    pub fn new(reactor: Reactor<S>, connection: Connection) -> Self {
        let (event_handle, event_chan) = mpsc::unbounded();

        CoreReactor {
            event_handle,
            event_chan,
            connection,
            reactor,
        }
    }

    fn handle(&self) -> ReactorHandle {
        ReactorHandle {
            event_channel: self.event_handle.clone(),
        }
    }

    fn poll_event_channel(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.event_chan.poll()) {
                Some(event) => {
                    self.send_wire_event(event.to_wire_event());
                    self.reactor.handle_event(event.as_ref());
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn poll_connection(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.connection.poll()) {
                ConnectionEvent::Connected => {}
                ConnectionEvent::Disconnected => {}
                ConnectionEvent::Packet(data) => {
                    let event = proto::Event::decode(&data).unwrap();
                    let wire_event = WireEvent {
                        type_id: event.type_id,
                        data: event.data,
                    };
                    self.reactor.handle_wire_event(&wire_event);
                }
            }
        }
    }

    fn send_wire_event(&mut self, event: WireEvent) {
        let proto_event = proto::Event {
            type_id: event.type_id,
            data: event.data,
        };
        let mut buf = BytesMut::with_capacity(proto_event.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        proto_event.encode(&mut buf).unwrap();
        self.connection.send(buf.to_vec());
    }
}

impl<S> Future for CoreReactor<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        try!(self.poll_event_channel());
        try!(self.poll_connection());
        return Ok(Async::NotReady);
    }
}


pub struct ReactorHandle {
    event_channel: mpsc::UnboundedSender<Box<AnyEvent>>,
}

impl ReactorHandle {
    fn dispatch_event<T>(&mut self, data: T)
        where T: EventType + 'static
    {
        let event = Box::new(EventBox { data });
        self.event_channel.unbounded_send(event)
            .expect("event channel broke");
    }
}

pub struct EventBox<T>
    where T: EventType
{
    data: T,
}

impl<T> AnyEvent for EventBox<T>
    where T: EventType + 'static
{
    fn data(&self) -> &Any { self }
    
    fn type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn to_wire_event(&self) -> WireEvent {
        WireEvent {
            type_id: T::TYPE_ID,
            data: self.data.encode(),
        }
    }
}
