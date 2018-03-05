use futures::{Future, Poll, Async, Stream};
use futures::sink::{Sink, Send};
use std::io;
use std::mem;


enum SinkState<S: Sink> {
    Closed,
    Sending(Send<S>),
    Ready(S),
}

impl<S> SinkState<S>
    where S: Stream + Sink,
          io::Error: From<S::SinkError> + From<S::Error>
{
    fn poll_send(&mut self) -> Poll<S, io::Error> {
        let mut state = mem::replace(self, SinkState::Closed);

        if let SinkState::Sending(mut send) = state {
            state = match try!(send.poll()) {
                Async::Ready(sink) => SinkState::Ready(sink),
                Async::NotReady => SinkState::Sending(send),
            };
        }

        match state {
            SinkState::Closed => bail!(io::ErrorKind::NotConnected),
            SinkState::Ready(sink) => Ok(Async::Ready(sink)),
            SinkState::Sending(send) => {
                *self = SinkState::Sending(send);
                return Ok(Async::NotReady);
            }
        }
    }

    fn inner_mut<'a>(&'a mut self) -> io::Result<&'a mut S> {
        match self {
            &mut SinkState::Closed => bail!(io::ErrorKind::NotConnected),
            &mut SinkState::Ready(ref mut t) => Ok(t),
            &mut SinkState::Sending(ref mut send) => Ok(send.get_mut()),
        }
    }

    fn poll_recv(&mut self) -> Poll<S::Item, io::Error> {
        let inner = try!(self.inner_mut());
        match try_ready!(inner.poll()) {
            Some(item) => Ok(Async::Ready(item)),
            None => bail!(io::ErrorKind::ConnectionAborted),
        }
    }
}


/// A persistent buffering connection wrapper.
/// When the underlying connection closes, the ClientConnection stays alive
/// and buffers messages until a new underlying connection is offered to
/// flush the buffer to.
pub struct ClientConnection<S>
    where S: Sink + Stream,
          io::Error: From<S::SinkError> + From<S::Error>
{
    inner: Option<SinkState<S>>,
    send_buffer: Vec<S::SinkItem>,
}

impl<S> ClientConnection<S>
    where S: Stream + Sink,
          io::Error: From<S::SinkError> + From<S::Error>
{
    /// Create a disconnected ClientConnection
    pub fn new() -> Self {
        ClientConnection {
            inner: None,
            send_buffer: Vec::new(),
        }
    }

    /// Supply a new backing transport for this client connection.
    pub fn set_transport(&mut self, conn: S) {
        self.inner = Some(SinkState::Ready(conn));
    }

    /// Drop the connection in use
    pub fn drop_transport(&mut self) {
        self.inner = None;
    }

    /// Add an item to the send buffer
    pub fn queue_send(&mut self, item: S::SinkItem) {
        self.send_buffer.push(item);
    }

    /// Make progress in flushing the send buffer
    pub fn flush(&mut self) -> Poll<(), io::Error> {
        if let Some(conn) = self.inner.as_mut() {
            loop {
                let stream = try_ready!(conn.poll_send());
                let item = match self.send_buffer.is_empty() {
                    false => self.send_buffer.remove(0),
                    true => {
                        *conn = SinkState::Ready(stream);
                        return Ok(Async::Ready(()));
                    },
                };
                *conn = SinkState::Sending(stream.send(item));
            }
        } else {
            return Ok(Async::NotReady);
        }
    }

    /// Pull messages from the connection
    pub fn poll(&mut self) -> Poll<S::Item, io::Error> {
        if let Some(stream) = self.inner.as_mut() {
            match try!(stream.poll_recv()) {
                // TODO: disconnects are not handled by this
                Async::Ready(item) => Ok(Async::Ready(item)),
                Async::NotReady => Ok(Async::NotReady),
            }
        } else {
            return Ok(Async::NotReady);
        }
    }
}