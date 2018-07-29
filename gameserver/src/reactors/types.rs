use std::any::Any;
use prost::Message;

pub trait Event : Message {
    const TYPE_ID: u32;
}

pub trait EventType {
    const TYPE_ID: u32;

    fn encode(&self) -> Vec<u8>;
    fn decode(&[u8]) -> Self;
}

pub trait AnyEvent: Send {
    fn data(&self) -> &Any;
    fn type_id(&self) -> u32;
    fn as_wire_event(&self) -> WireEvent;
}

pub struct WireEvent {
    pub type_id: u32,
    pub data: Vec<u8>,
}

pub struct EventBox<T>
    where T: EventType
{
    event: T,
}

impl<T> EventBox<T>
    where T: EventType + Send + 'static
{
    pub fn new(event: T) -> Self {
        EventBox { event }
    }
    pub fn wrap(event: T) -> Box<AnyEvent> {
        return Box::new(EventBox::new(event));
    }
}

impl<T> AnyEvent for EventBox<T>
    where T: EventType + Send + 'static
{
    fn data(&self) -> &Any { &self.event }
    
    fn type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn as_wire_event(&self) -> WireEvent {
        WireEvent {
            type_id: T::TYPE_ID,
            data: self.event.encode(),
        }
    }
}
