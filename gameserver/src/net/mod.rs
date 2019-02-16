use std::collections::{VecDeque, HashMap};

use capnp_futures::serialize::Transport;
use tokio::net::TcpStream;

use futures::{Future, Async, Poll, Stream, Sink, AsyncSink};

use capnp;
use capnp::any_pointer;
use capnp::message::{Builder, HeapAllocator};

use network_capnp::network_message;
use messaging::types::Handler;

type MessageHandler<S> = Box<
    for<'a>
        Handler<'a, S, any_pointer::Owned, Output=(), Error=capnp::Error>
>;

struct StreamHandler<S> {
    transport: Transport<TcpStream, Builder<HeapAllocator>>,
    state: S,
    handlers: HashMap<u64, MessageHandler<S>>,
    write_queue: VecDeque<Builder<HeapAllocator>>,
}

impl<S> StreamHandler<S> {
    fn flush_writes(&mut self) -> Poll<(), capnp::Error> {
        while let Some(builder) = self.write_queue.pop_front() {
            match self.transport.start_send(builder)? {
                AsyncSink::NotReady(builder) => {
                    self.write_queue.push_front(builder);
                    return Ok(Async::NotReady);
                }
                AsyncSink::Ready => {},
            }
        }

        return Ok(Async::Ready(()));
    }

    fn poll_transport(&mut self) -> Poll<(), capnp::Error> {
        while let Some(builder) = try_ready!(self.transport.poll()) {
            let reader = builder.get_root::<network_message::Reader>()?;
            let type_id = reader.get_type_id();
            match self.handlers.get(&type_id) {
                None => eprintln!("received unknown message type"),
                Some(handler) => {
                    handler.handle(&mut self.state, reader.get_data())?;
                }
            }
            try_ready!(self.flush_writes());
        }
        return Ok(Async::Ready(()));
    }

    fn try_poll(&mut self) -> Poll<(), capnp::Error> {
        try_ready!(self.flush_writes());
        return self.poll_transport();
    }
}

impl<S> Future for StreamHandler<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        Ok(self.try_poll().unwrap())
    }
}