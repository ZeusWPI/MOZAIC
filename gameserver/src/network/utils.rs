use futures::{Sink, Poll, Async, AsyncSink};

pub struct Sender<T> {
    item: Option<T>,
}

impl<T> Sender<T> {
    pub fn new(item: T) -> Self {
        Sender {
            item: Some(item),
        }
    }

    pub fn queue(&mut self, item: T) {
        if self.item.is_some() {
            panic!("called queue on sender that was not ready");
        }
        self.item = Some(item);
    }

    pub fn poll_send<S>(&mut self, sink: &mut S) -> Poll<(), S::SinkError>
        where S: Sink<SinkItem = T>
    {
        if let Some(item) = self.item.take() {
            match try!(sink.start_send(item)) {
                AsyncSink::NotReady(item) => {
                    self.item = Some(item);
                    return Ok(Async::NotReady);
                },
                AsyncSink::Ready => (),
            }
        }

        return sink.poll_complete();
    }
}