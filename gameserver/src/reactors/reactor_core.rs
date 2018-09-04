use std::marker::PhantomData;
use std::collections::HashMap;
use super::types::*;


/// The combination of a state and a set of handlers that act upon that state.
/// The ReactorCore 'reduces' over the event stream.
pub struct ReactorCore<S> {
    state: S,
    handlers: HashMap<u32, Box<SomeHandler<S, ()>>>,
}

impl<S> ReactorCore<S> {
    pub fn new(state: S) -> Self {
        ReactorCore {
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

    pub fn add_handler<F, T>(&mut self, fun: F)
        where T: Event + 'static + Send,
              F: FnMut(&mut S, &T) + 'static + Send,
              S: 'static + Send
    {
        let handler = Box::new(Handler::new(fun));
        self.handlers.insert(T::TYPE_ID, handler);
    }
}


// The Send bound is required so that reactors can implement Send as well.
pub trait SomeHandler<S, R>: Send {
    fn event_type_id(&self) -> u32;
    fn handle_event(&mut self, state: &mut S, event: &AnyEvent) -> R;
    fn handle_wire_event(&mut self, state: &mut S, event: &WireEvent) -> R;
}

pub struct Handler<S, T, F, R>
    where F: FnMut(&mut S, &T) -> R
{
    phantom_s: PhantomData<S>,
    phantom_t: PhantomData<T>,
    phantom_r: PhantomData<R>,
    handler: F,
}

impl<S, T, F, R> Handler<S, T, F, R>
    where F: FnMut(&mut S, &T) -> R
{
    pub fn new(fun: F) -> Self {
        Handler {
            phantom_s: PhantomData,
            phantom_t: PhantomData,
            phantom_r: PhantomData,
            handler: fun,
        }
    }
}

impl<S, T, F, R> SomeHandler<S, R> for Handler<S, T, F, R>
    where F: FnMut(&mut S, &T) -> R + Send,
          T: Event + Send + 'static,
          S: Send,
          R: Send
{
    fn event_type_id(&self) -> u32 {
        return T::TYPE_ID;
    }

    fn handle_event(&mut self, state: &mut S, event: &AnyEvent) -> R{
        if let Some(data) = event.data().downcast_ref::<T>() {
            (&mut self.handler)(state, &data)
        } else {
            panic!("wrong argument type");
        }
    }

    fn handle_wire_event(&mut self, state: &mut S, wire_event: &WireEvent) -> R
    {
        let data = T::decode(&wire_event.data).expect("decoding error");
        (&mut self.handler)(state, &data)
    }
}

impl<S> EventHandler for ReactorCore<S> {
    fn handle_event(&mut self, event: &AnyEvent) {
        self.handle_event(event);
    }

    fn handle_wire_event(&mut self, event: WireEvent) {
        self.handle_wire_event(&event);
    }
}