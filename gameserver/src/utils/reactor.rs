use std::marker::PhantomData;
use std::any::Any;
use std::collections::HashMap;

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

pub trait Handler {
    fn handle_event(&mut self, event: &AnyEvent);
}

pub struct EventHandler<T, F>
    where F: FnMut(&Event<T>)
{
    phantom_t: PhantomData<T>,
    handler: F,
}

impl<T, F> Handler for EventHandler<T, F>
    where F: FnMut(&Event<T>),
        T: EventType + 'static
{
    fn handle_event(&mut self, event: &AnyEvent) {
        if let Some(evt) = event.as_any().downcast_ref() {
            (&mut self.handler)(evt);
        } else {
            panic!("wrong argument type");
        }
    }
}

pub struct Reactor {
    handlers: HashMap<u32, Box<Handler>>,
}

impl Reactor {
    fn handle_event(&mut self, event: &AnyEvent) {
        let event_type = event.type_id();
        if let Some(handler) = self.handlers.get_mut(&event_type) {
            handler.handle_event(event);
        }
    }
}