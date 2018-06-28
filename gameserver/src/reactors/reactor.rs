use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

pub enum SomeEvent {
    Event(Box<AnyEvent>),
    WireEvent(WireEvent),
}

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

pub struct EventBox<T>
    where T: EventType
{
    event: T,
}

impl<T> EventBox<T>
    where T: EventType + Send + 'static
{
    pub fn wrap(event: T) -> Box<AnyEvent> {
        let event_box = EventBox { event };
        return Box::new(event_box);
    }
}

impl<T> AnyEvent for EventBox<T>
    where T: EventType + Send + 'static
{
    fn data(&self) -> &Any { self }
    
    fn type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn to_wire_event(&self) -> WireEvent {
        WireEvent {
            type_id: T::TYPE_ID,
            data: self.event.encode(),
        }
    }
}
// The Send bound is required so that reactors can implement Send as well.
pub trait Handler<S>: Send {
    fn event_type_id(&self) -> u32;
    fn handle_event(&mut self, state: &mut S, event: &AnyEvent);
    fn handle_wire_event(&mut self, state: &mut S, event: &WireEvent);

    fn handle(&mut self, state: &mut S, some_event: &SomeEvent) {
        match *some_event {
            SomeEvent::Event(ref event) => {
                self.handle_event(state, event.as_ref());
            }
            SomeEvent::WireEvent(ref wire_event) => {
                self.handle_wire_event(state, wire_event);
            }
        }
    }
}

pub struct EventHandler<S, T, F>
    where F: FnMut(&mut S, &T)
{
    phantom_s: PhantomData<S>,
    phantom_t: PhantomData<T>,
    handler: F,
}

impl<S, T, F> EventHandler<S, T, F>
    where F: FnMut(&mut S, &T)
{
    pub fn new(fun: F) -> Self {
        EventHandler {
            phantom_s: PhantomData,
            phantom_t: PhantomData,
            handler: fun,
        }
    }
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

    pub fn handle(&mut self, some_event: &SomeEvent) {
        match *some_event {
            SomeEvent::Event(ref event) => {
                self.handle_event(event.as_ref());
            }
            SomeEvent::WireEvent(ref wire_event) => {
                self.handle_wire_event(wire_event);
            }
        }
    }

    pub fn handle_event(&mut self, event: &AnyEvent) {
        let event_type = event.type_id();

    }

    pub fn handle_wire_event(&mut self, event: &WireEvent) {
        let event_type = event.type_id;
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_wire_event(&mut self.state, event);
        }
    }

    pub fn add_handler<F, T>(&mut self, fun: F)
        where T: EventType + 'static + Send,
              F: FnMut(&mut S, &T) + 'static + Send,
              S: 'static + Send
    {
        let handler = Box::new(EventHandler::new(fun));
        self.handlers.insert(T::TYPE_ID, handler);
    }
}