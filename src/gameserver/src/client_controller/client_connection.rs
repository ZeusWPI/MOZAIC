use futures::{Future, Async};
use futures::stream::{Stream, SplitStream, SplitSink};
use futures::sink::{Sink, Send};

enum SinkState<S>
    where S: Sink
{
    Sending(Send<S>),
    Ready(S)
}

struct ClientConnection<S>
    where S: Sink + Stream
{
    sink_state: Option<SinkState<SplitSink<S>>>,
    stream: Option<SplitStream<S>>,
    send_buffer: Vec<S::SinkItem>,
}


impl<S> SinkState<S>
    where S: Sink
{
    fn step(self) -> Result<SinkState<S>, S::SinkError> {
        let new_state = match self {
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
}

impl<S> ClientConnection<S>
    where S: Stream + Sink
{
    pub fn queue_send(&mut self, item: S::SinkItem) {
        self.send_buffer.push(item);
    }

    fn flush(&mut self) -> Result<(), S::SinkError> {
        if let Some(mut state) = self.sink_state.take() {
            loop {
                state = try!(state.step());
                let sink = match state {
                    SinkState::Ready(sink) => sink,
                    SinkState::Sending(send) => {
                        // sink is not ready; abort flush
                        self.sink_state = Some(SinkState::Sending(send));
                        return Ok(());
                    },
                };
                let send = match self.send_buffer.is_empty() {
                    false => {
                        let item = self.send_buffer.remove(0);
                        sink.send(item)
                    },
                    true => {
                        // buffer is empty; flush complete
                        self.sink_state = Some(SinkState::Ready(sink));
                        return Ok(());
                    }
                };
                state = SinkState::Sending(send);
            }
        } else {
            // sink state is none
            return Ok(());
        }
    }

    pub fn poll(&mut self) -> Result<Option<S::Item>, S::Error> {
        if let Some(stream) = self.stream.as_mut() {
            match try!(stream.poll()) {
                // TODO: disconnects are not handled by this
                Async::Ready(item) => Ok(item),
                Async::NotReady => Ok(None),
            }
        } else {
            return Ok(None);
        }
    }
}