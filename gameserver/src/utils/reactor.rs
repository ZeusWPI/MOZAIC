use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

use bytes::BytesMut;
use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use network::connection::{Connection, ConnectionEvent};
use protocol as proto;
use prost::Message;


pub struct EventBox<T>
    where T: EventType
{
    data: T,
}

pub struct WireEvent {
    type_id: u32,
    data: Vec<u8>,
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

pub trait EventType {
    const TYPE_ID: u32;

    fn encode(&self) -> Vec<u8>;
    fn decode(&Vec<u8>) -> Self;
}

pub trait AnyEvent: Any {
    fn data(&self) -> &Any;
    fn type_id(&self) -> u32;
    fn to_wire_event(&self) -> WireEvent;
}

pub trait Handler<S> {
    fn event_type_id(&self) -> u32;
    fn handle_event(&mut self, state: &mut S, event: &AnyEvent);
    fn handle_wire_event(&mut self, state: &mut S, event: &WireEvent);
}

pub struct EventHandler<S, T, F>
    where F: FnMut(&mut S, &T)
{
    phantom_s: PhantomData<S>,
    phantom_t: PhantomData<T>,
    handler: F,
}

impl<S, T, F> Handler<S> for EventHandler<S, T, F>
    where F: FnMut(&mut S, &T),
          T: EventType + 'static
{
    fn event_type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn handle_event(&mut self, state: &mut S, event: &AnyEvent) {
        if let Some(data) = event.data().downcast_ref::<T>() {
            (&mut self.handler)(state, &data);
        } else {
            panic!("wrong argument type");
        }
    }

    fn handle_wire_event(&mut self, state: &mut S, wire_event: &WireEvent) {
        let data = T::decode(&wire_event.data);
        (&mut self.handler)(state, &data);
    }
}

pub struct Reactor<S> {
    state: S,
    handlers: HashMap<u32, Box<Handler<S>>>,
}

impl<S> Reactor<S> {
    pub fn new(state: S) -> Self {
        Reactor {
            handlers: HashMap::new(),
            state,
        }
    }

    fn handle_event(&mut self, event: &AnyEvent) {
        let event_type = event.type_id();
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_event(&mut self.state, event);
        }
    }

    fn handle_wire_event(&mut self, event: &WireEvent) {
        let event_type = event.type_id;
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_wire_event(&mut self.state, event);
        }
    }

    fn set_handler(&mut self, handler: Box<Handler<S>>) {
        let type_id = handler.event_type_id();
        self.handlers.insert(type_id, handler);
    }
}

pub struct ReactorDriver<S> {
    reactor: Reactor<S>,

    event_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    event_handle: mpsc::UnboundedSender<Box<AnyEvent>>,
    
    connection: Connection,
}

impl<S> ReactorDriver<S> {
    pub fn new(reactor: Reactor<S>, connection: Connection) -> Self {
        let (event_handle, event_chan) = mpsc::unbounded();

        ReactorDriver {
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

impl<S> Future for ReactorDriver<S> {
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