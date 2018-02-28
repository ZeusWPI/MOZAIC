use futures::{Future, Poll, Async};
use futures::sink::{Sink, Send};

enum SinkState<S>
    where S: Sink
{
    Disconnected,
    Sending(Send<S>),
    Ready(S)
}


impl<S> SinkState<S>
    where S: Sink
{
    fn step(self) -> Result<SinkState<S>, S::SinkError> {
        let new_state = match self {
            SinkState::Disconnected => SinkState::Disconnected,
            SinkState::Ready(sink) => SinkState::Ready(sink),
            SinkState::Sending(mut send) => {
                match try!(send.poll()) {
                    Async::Ready(sink) => SinkState::Ready(sink),
                    Async::NotReady => SinkState::Sending(send),
                }
            },
        };
        return Ok(new_state);
    }

    fn poll(&self) -> Async<()> {
        match self {
            // Disconnected is not a waiting state because there is no
            // underlying IO being performed
            &SinkState::Disconnected => Async::Ready(()),
            &SinkState::Sending(_) => Async::NotReady,
            &SinkState::Ready(_) => Async::Ready(()),
        }
    }
}

pub struct BufferedSender<S>
    where S: Sink
{
    state: Option<SinkState<S>>,
    buffer: Vec<S::SinkItem>,
}

impl<S> BufferedSender<S>
    where S: Sink
{
    pub fn new(sink: S) -> Self {
        BufferedSender {
            state: Some(SinkState::Ready(sink)),
            buffer: Vec::new(),
        }
    }
    
    pub fn send(&mut self, item: S::SinkItem) {
        let state = self.state.take().unwrap();

        if let SinkState::Ready(sink) = state {
            let send = sink.send(item);
            self.state = Some(SinkState::Sending(send));
        } else {
            self.buffer.push(item);
        }
    }

    fn poll_state(&mut self) -> Poll<(), S::SinkError> {
        let mut state = self.state.take().unwrap();
        state = try!(state.step());
        let async = state.poll();
        self.state = Some(state);
        Ok(async)
    }
}

impl<S> Future for BufferedSender<S>
    where S: Sink
{
    type Item = ();
    type Error = S::SinkError;

    fn poll(&mut self) -> Poll<(), S::SinkError> {
        while !self.buffer.is_empty() {
            try_ready!(self.poll_state());
            let item = self.buffer.remove(0);
            self.send(item);
        }
        return self.poll_state();
    }
}
