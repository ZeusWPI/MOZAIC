use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

pub struct WireEvent {
    pub type_id: u32,
    pub data: Vec<u8>,
}

pub trait EventType {
    const TYPE_ID: u32;

    fn encode(&self) -> Vec<u8>;
    fn decode(&[u8]) -> Self;
}

pub trait AnyEvent: Send {
    fn data(&self) -> &Any;
    fn type_id(&self) -> u32;
    fn to_wire_event(&self) -> WireEvent;
}

// The Send bound is required so that reactors can implement Send as well.
pub trait Handler<S>: Send {
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
    where F: FnMut(&mut S, &T) + Send,
          T: EventType + Send + 'static,
          S: Send
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

    pub fn handle_event(&mut self, event: &AnyEvent) {
        let event_type = event.type_id();
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_event(&mut self.state, event);
        }
    }

    pub fn handle_wire_event(&mut self, event: &WireEvent) {
        let event_type = event.type_id;
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_wire_event(&mut self.state, event);
        }
    }

    pub fn set_handler(&mut self, handler: Box<Handler<S>>) {
        let type_id = handler.event_type_id();
        self.handlers.insert(type_id, handler);
    }
}