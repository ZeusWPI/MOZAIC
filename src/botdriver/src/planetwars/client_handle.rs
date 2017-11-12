use futures::{Future, Poll, Async};
use futures::stream::{Stream, StreamFuture, SplitStream, SplitSink};
use futures::sink::Sink;

use planetwars::writer::Writer;

pub struct ClientHandle<T>
    where T: Stream + Sink
{
    client_id: usize,
    
    writer: Writer<SplitSink<T>>,
    stream_future: StreamFuture<SplitStream<T>>,
}

impl<T> ClientHandle<T>
    where T: Stream + Sink
{
    fn poll_message(&mut self) -> Poll<T::Item, T::Error> {
        let poll = self.stream_future.poll().map_err(|(err, stream)| err);
        let (item, stream) = try_ready!(poll);
        self.stream_future = stream.into_future();
        // TODO: don't unwrap here
        Ok(Async::Ready(item.unwrap()))
    }
}

pub enum ClientError<T>
    where T: Stream + Sink
{
    StreamError(T::Error),
    SendError(T::SinkError),
}

impl<T> Future for ClientHandle<T>
    where T: Stream + Sink
{
    type Item = T::Item;
    type Error = ClientError<T>;

    fn poll(&mut self) -> Poll<T::Item, ClientError<T>> {
        let write = self.writer.poll().map_err(|err| ClientError::SendError(err));
        let read = self.poll_message().map_err(|err| ClientError::StreamError(err));
        try!(write);
        read
    }
}
