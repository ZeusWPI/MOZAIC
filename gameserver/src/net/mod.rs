use std::collections::{VecDeque, HashMap};
use std::marker::PhantomData;

use capnp_futures::serialize::Transport;
use tokio::net::TcpStream;

use futures::{Future, Async, Poll, Stream, Sink, AsyncSink};
use futures::sync::mpsc;

use capnp;
use capnp::any_pointer;
use capnp::traits::{Owned, HasTypeId};
use capnp::message::{ReaderOptions, Builder, HeapAllocator};

use network_capnp::{network_message, publish};
use messaging::types::{Message, Handler, AnyPtrHandler};

pub struct Writer<'a> {
    write_queue: &'a mut VecDeque<Builder<HeapAllocator>>,
}

impl<'a> Writer<'a> {
    pub fn write<M, F>(&mut self, _m: M, initializer: F)
        where F: for<'b> FnOnce(capnp::any_pointer::Builder<'b>),
              M: Owned<'static>,
              <M as Owned<'static>>::Builder: HasTypeId,
    {
        let mut builder = Builder::new_default();
        {
            let mut msg = builder.init_root::<network_message::Builder>();
            msg.set_type_id(<M as Owned<'static>>::Builder::type_id());
            {
                let payload_builder = msg.reborrow().init_data();
                initializer(payload_builder);
            }
        }
        self.write_queue.push_back(builder);
    }
}

type MessageHandler<S> = Box<
    for<'a>
        Handler<'a,
            MsgHandlerCtx<'a, S>,
            any_pointer::Owned, Output=(), Error=capnp::Error>
>;

pub struct MsgHandlerCtx<'a, S> {
    pub state: &'a mut S,
    pub writer: &'a mut Writer<'a>,
}

pub struct MsgHandler<M, F> {
    message_type: PhantomData<M>,
    function: F,
}

impl<M, F> MsgHandler<M, F> {
    pub fn new(function: F) -> Self {
        MsgHandler {
            message_type: PhantomData,
            function,
        }
    }
}

impl<'a, S,  M, F, T, E> Handler<'a, MsgHandlerCtx<'a, S>, M> for MsgHandler<M, F>
    where F: Fn(&mut S, &mut Writer, <M as Owned<'a>>::Reader) -> Result<T, E>,
          F: Send,
          M: Owned<'a> + 'static + Send
{
    type Output = T;
    type Error = E;

    fn handle(&self, ctx: &mut MsgHandlerCtx<'a, S>, reader: <M as Owned<'a>>::Reader)
        -> Result<T, E>
    {
        let MsgHandlerCtx { state, writer } = ctx;
        (self.function)(state, writer, reader)
    }
}

pub struct StreamHandler<S> {
    transport: Transport<TcpStream, Builder<HeapAllocator>>,
    state: S,
    handlers: HashMap<u64, MessageHandler<S>>,
    write_queue: VecDeque<Builder<HeapAllocator>>,
}

impl<S> StreamHandler<S> {
    pub fn new(state: S, stream: TcpStream) -> Self {
        StreamHandler {
            transport: Transport::new(stream, ReaderOptions::default()),
            state,
            handlers: HashMap::new(),
            write_queue: VecDeque::new(),
        }
    }

    pub fn writer<'a>(&'a mut self) -> Writer<'a> {
        Writer {
            write_queue: &mut self.write_queue,
        }
    }

    pub fn on<M, H>(&mut self, _m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a> Handler<'a, MsgHandlerCtx<'a, S>, M, Output=(), Error=capnp::Error>
    {
        let boxed = Box::new(AnyPtrHandler::new(h));
        self.handlers.insert(
            <M as Owned<'static>>::Reader::type_id(),
            boxed,
        );
    }


    fn flush_writes(&mut self) -> Poll<(), capnp::Error> {
        while let Some(builder) = self.write_queue.pop_front() {
            match self.transport.start_send(builder)? {
                AsyncSink::Ready => { }, // continue
                AsyncSink::NotReady(builder) => {
                    self.write_queue.push_front(builder);
                    return Ok(Async::NotReady);
                },
            };
        }

        return self.transport.poll_complete();
    }

    fn poll_transport(&mut self) -> Poll<(), capnp::Error> {
        while let Some(builder) = try_ready!(self.transport.poll()) {
            let reader = builder.get_root::<network_message::Reader>()?;
            let type_id = reader.get_type_id();
            match self.handlers.get(&type_id) {
                None => eprintln!("received unknown message type"),
                Some(handler) => {
                    let mut writer = Writer {
                        write_queue: &mut self.write_queue,
                    };
                    let mut ctx = MsgHandlerCtx {
                        state: &mut self.state,
                        writer: &mut writer,
                    };
                    handler.handle(&mut ctx, reader.get_data())?;
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

pub struct Forwarder<S> {
    pub handler: StreamHandler<S>,
    pub rx: mpsc::UnboundedReceiver<Message>,
}

impl<S> Forwarder<S> {
    fn forward_messages(&mut self) -> Poll<(), ()> {
        while let Some(msg) = try_ready!(self.rx.poll()) {
            self.handler.writer().write(publish::Owned, |b| {
                let mut publish: publish::Builder = b.init_as();
                publish.set_message(msg.bytes());
            });
        }
        return Ok(Async::Ready(()))
    }
}

impl<S> Future for Forwarder<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        match self.forward_messages()? {
            Async::Ready(()) => return Ok(Async::Ready(())),
            Async::NotReady => {},
        };
        return self.handler.poll();
    }
}
