use futures::{Future, Poll, Async};
use futures::sink::{Sink, Send};

enum SinkState<S>
    where S: Sink
{
    Sending(Send<S>),
    Ready(S)
}

impl<S> SinkState<S>
    where S: Sink
{
    fn step(self) -> Result<SinkState<S>, S::SinkError> {
        match self {
            SinkState::Ready(sink) => Ok(SinkState::Ready(sink)),
            SinkState::Sending(mut send) => {
                match send.poll()? {
                    Async::Ready(sink) => Ok(SinkState::Ready(sink)),
                    Async::NotReady => Ok(SinkState::Sending(send)),
                }
            },
        }
    }

    fn poll(&self) -> Async<()> {
        match self {
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
        let buffer = &mut self.buffer;
        let new_state = match state {
            SinkState::Sending(send) => {
                buffer.push(item);
                SinkState::Sending(send)
            },
            SinkState::Ready(sink) => {
                let send = sink.send(item);
                SinkState::Sending(send)
            }
        };
        self.state = Some(new_state);
    }

    fn poll_state(&mut self) -> Poll<(), S::SinkError> {
        let mut state = self.state.take().unwrap();
        state = state.step()?;
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
