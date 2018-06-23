use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

use bytes::BytesMut;
use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};
use network::connection::{Connection, ConnectionEvent};
use protocol as proto;
use prost::Message;


pub struct Event<T>
    where T: EventType
{
    data: T,
}

pub struct WireEvent {
    type_id: u32,
    data: Vec<u8>,
}

impl<T> AnyEvent for Event<T>
    where T: EventType + 'static
{
    fn as_any(&self) -> &Any { self }
    
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
    fn as_any(&self) -> &Any;
    fn type_id(&self) -> u32;
    fn to_wire_event(&self) -> WireEvent;
}

pub trait Handler<S> {
    fn event_type_id(&self) -> u32;
    fn handle_event(&mut self, state: &mut S, event: &AnyEvent);
    fn handle_wire_event(&mut self, state: &mut S, event: &WireEvent);
}

pub struct EventHandler<S, T, F>
    where F: FnMut(&mut S, &Event<T>)
{
    phantom_s: PhantomData<S>,
    phantom_t: PhantomData<T>,
    handler: F,
}

impl<S, T, F> Handler<S> for EventHandler<S, T, F>
    where F: FnMut(&mut S, &Event<T>),
          T: EventType + 'static
{
    fn event_type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn handle_event(&mut self, state: &mut S, event: &AnyEvent) {
        if let Some(evt) = event.as_any().downcast_ref() {
            (&mut self.handler)(state, evt);
        } else {
            panic!("wrong argument type");
        }
    }

    fn handle_wire_event(&mut self, state: &mut S, wire_event: &WireEvent) {
        let data = T::decode(&wire_event.data);
        let event = Event { data };
        (&mut self.handler)(state, &event);
    }
}

pub enum ReactorCommand<S> {
    InstallHandler {
        handler: Box<Handler<S>>,
    }
}

pub struct Reactor<S> {
    state: S,
    handlers: HashMap<u32, Box<Handler<S>>>,

    ctrl_chan: mpsc::UnboundedReceiver<ReactorCommand<S>>,
    ctrl_handle: mpsc::UnboundedSender<ReactorCommand<S>>,

    event_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
    event_handle: mpsc::UnboundedSender<Box<AnyEvent>>,

    connection: Connection,
}

impl<S> Reactor<S> {
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

    fn handle(&self) -> ReactorHandle {
        ReactorHandle {
            event_channel: self.event_handle.clone(),
        }
    }

    fn add_handler(&mut self, handler: Box<Handler<S>>) {
        let type_id = handler.event_type_id();
        self.handlers.insert(type_id, handler);
    }

    fn handle_commands(&mut self) -> Poll<(), ()> {
        loop {
            match try_ready!(self.ctrl_chan.poll()) {
                Some(ReactorCommand::InstallHandler { handler }) => {
                    self.add_handler(handler);
                }
                None => {
                    // TODO: How should this be handled?
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn handle_events(&mut self) -> Poll<(), ()> {
        loop {
            try!(self.handle_commands());
            match try_ready!(self.event_chan.poll()) {
                Some(event) => {
                    self.send_wire_event(event.to_wire_event());
                    self.handle_event(event.as_ref());
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }

    fn poll_client_connection(&mut self) -> Poll<(), ()> {
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
                    self.handle_wire_event(&wire_event);
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

pub struct ReactorHandle {
    event_channel: mpsc::UnboundedSender<Box<AnyEvent>>,
}

impl ReactorHandle {
    fn dispatch_event<T>(&mut self, data: T)
        where T: EventType + 'static
    {
        let event = Event { data };
        self.event_channel.unbounded_send(Box::new(event))
            .expect("event channel broke");
    }
}