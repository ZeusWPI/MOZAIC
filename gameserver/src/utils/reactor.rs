use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

use futures::sync::mpsc;
use futures::{Future, Poll, Async, Stream};

pub struct Event<T>
    where T: EventType
{
    data: T,
}

impl<T> AnyEvent for Event<T>
    where T: EventType + 'static
{
    fn as_any(&self) -> &Any { self }
    
    fn type_id(&self) -> u32 {
        return T::TYPE_ID;
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
}

pub trait Handler<S> {
    fn event_type_id(&self) -> u32;
    fn handle_event(&mut self, state: &mut S, event: &AnyEvent);
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
    event_chan: mpsc::UnboundedReceiver<Box<AnyEvent>>,
}

impl<S> Reactor<S> {
    fn handle_event(&mut self, event: &AnyEvent) {
        let event_type = event.type_id();
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_event(&mut self.state, event);
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
                    self.handle_event(event.as_ref());
                }
                None => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }
}