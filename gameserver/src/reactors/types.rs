use std::any::Any;
use prost::Message;

pub trait Event : Message + Default {
    const TYPE_ID: u32;
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
    where T: Event
{
    event: T,
}

impl<T> EventBox<T>
    where T: Event + Send + 'static
{
    pub fn new(event: T) -> Self {
        EventBox { event }
    }
    pub fn wrap(event: T) -> Box<AnyEvent> {
        return Box::new(EventBox::new(event));
    }
}

impl<T> AnyEvent for EventBox<T>
    where T: Event + Send + 'static
{
    fn data(&self) -> &Any { &self.event }
    
    fn type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn as_wire_event(&self) -> WireEvent {
        let mut buf = Vec::with_capacity(self.event.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        self.event.encode(&mut buf).unwrap();

        return WireEvent {
            type_id: T::TYPE_ID,
            data:  buf,
        };
    }
}

enum TestEnum {
    ValueA = 3,
}