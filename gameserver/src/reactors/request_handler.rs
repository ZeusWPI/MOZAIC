use std::io;

use super::{Event, AnyEvent, EventHandler, WireEvent, ReactorCore};

pub struct RequestHandler<S> {
    core: ReactorCore<S, io::Result<WireEvent>>,
}

impl<S> RequestHandler<S> {
    pub fn new(state: S) -> Self {
        RequestHandler {
            core: ReactorCore::new(state),
        }
    }

    pub fn add_handler<F, T>(&mut self, fun: F)
        where T: Event + 'static + Send,
              F: FnMut(&mut S, &T) -> io::Result<WireEvent>,
              F: 'static + Send,
              S: 'static + Send,
    {
        self.core.add_handler(fun)
    }

}

impl<S> EventHandler for RequestHandler<S> {
    type Output = io::Result<WireEvent>;

    fn handle_event(&mut self, event: &AnyEvent) -> Self::Output {
        match self.core.handle_event(event) {
            Some(result) => result,
            None => Err(io::Error::new(
                io::ErrorKind::Other,
                "no such method",
            ))
        }
    }

    fn handle_wire_event(&mut self, event: WireEvent) -> Self::Output {
        match self.core.handle_wire_event(&event) {
            Some(result) => result,
            None => Err(io::Error::new(
                io::ErrorKind::Other,
                "no such method",
            ))
        }
    }
}