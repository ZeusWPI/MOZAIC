use futures::{Future, Async};
use futures::stream::{Stream, SplitStream, SplitSink};
use futures::sink::{Sink, Send};

/// A persistent buffering connection wrapper.
/// When the underlying connection closes, the ClientConnection stays alive
/// and buffers messages until a new underlying connection is offered to
/// flush the buffer to.
pub struct ClientConnection<S>
    where S: Sink + Stream
{
    sink_state: Option<SinkState<SplitSink<S>>>,
    stream: Option<SplitStream<S>>,
    send_buffer: Vec<S::SinkItem>,
}

impl<S> ClientConnection<S>
    where S: Stream + Sink
{
    /// Create a disconnected ClientConnection
    pub fn new() -> Self {
        ClientConnection {
            sink_state: None,
            stream: None,
            send_buffer: Vec::new(),
        }
    }

    /// Supply a new backing transport for this client connection.
    pub fn set_transport(&mut self, conn: S) {
        let (sink, stream) = conn.split();
        self.stream = Some(stream);
        self.sink_state = Some(SinkState::Ready(sink));
    }

    /// Drop the connection in use
    pub fn drop_connection(&mut self) {
        self.stream = None;
        self.sink_state = None;
    }

    /// Add an item to the send buffer
    pub fn queue_send(&mut self, item: S::SinkItem) {
        self.send_buffer.push(item);
    }

    /// Make progress in flushing the send buffer
    pub fn flush(&mut self) -> Result<(), S::SinkError> {
        if let Some(mut state) = self.sink_state.take() {
            loop {
                state = try!(state.step());

                // get available sink to send to
                let sink = match state {
                    SinkState::Ready(sink) => sink,
                    SinkState::Sending(send) => {
                        // sink is not ready; abort flush
                        self.sink_state = Some(SinkState::Sending(send));
                        return Ok(());
                    },
                };

                // get item from send buffer
                let item = match self.send_buffer.is_empty() {
                    false => self.send_buffer.remove(0),
                    true => {
                        // buffer is empty; flush complete
                        self.sink_state = Some(SinkState::Ready(sink));
                        return Ok(());
                    }
                };

                // perform send
                state = SinkState::Sending(sink.send(item));
            }
        } else {
            // sink state is none
            return Ok(());
        }
    }

    /// Pull messages from the connection
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

