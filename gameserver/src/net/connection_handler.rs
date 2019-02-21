use std::collections::{VecDeque, HashMap};
use std::marker::PhantomData;

use capnp_futures::serialize::Transport;
use tokio::net::TcpStream;

use futures::{Future, Async, Poll, Stream, Sink, AsyncSink};
use futures::sync::mpsc;

use capnp;
use capnp::any_pointer;
use capnp::traits::{Owned, HasTypeId};
use capnp::message::{ReaderOptions, Reader, Builder, HeapAllocator, ReaderSegments};

use network_capnp::{network_message, publish};
use messaging::types::{Message, Handler, AnyPtrHandler};


pub struct ConnectionHandler<S> {
    handler: StreamHandler<S>,
    rx: mpsc::UnboundedReceiver<Message>,
}

impl<S> ConnectionHandler<S> {
    pub fn new<F>(stream: TcpStream, core_constructor: F) -> Self
        where F: FnOnce(mpsc::UnboundedSender<Message>) -> HandlerCore<S>
    {
        let (tx, rx) = mpsc::unbounded();

        let core = core_constructor(tx);

        return ConnectionHandler {
            handler: StreamHandler::new(core, stream),
            rx,
        };
    }

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

impl<S> Future for ConnectionHandler<S> {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        if self.forward_messages()?.is_ready() {
            return Ok(Async::Ready(()));
        }

        if self.handler.poll_stream().unwrap().is_ready() {
            return Ok(Async::Ready(()));
        }

        return Ok(Async::NotReady);
    }
}

pub struct HandlerCore<S> {
    state: S,
    handlers: HashMap<u64, MessageHandler<S>>,
}

impl<S> HandlerCore<S> {
    pub fn new(state: S) -> Self {
        HandlerCore {
            state,
            handlers: HashMap::new(),
        }
    }

    pub fn on<M, H>(&mut self, _m: M, h: H)
        where M: for<'a> Owned<'a> + Send + 'static,
             <M as Owned<'static>>::Reader: HasTypeId,
              H: 'static + for <'a, 'c> Handler<'a, MsgHandlerCtx<'a, 'c, S>, M, Output=(), Error=capnp::Error>
    {
        let boxed = Box::new(AnyPtrHandler::new(h));
        self.handlers.insert(
            <M as Owned<'static>>::Reader::type_id(),
            boxed,
        );
    }

    pub fn handle(&mut self, writer: &mut Writer, r: network_message::Reader)
        -> Result<(), capnp::Error>
    {
        let type_id = r.get_type_id();
        match self.handlers.get(&type_id) {
            None => eprintln!("unknown message type"),
            Some(handler) => {
                let mut ctx = MsgHandlerCtx {
                    state: &mut self.state,
                    writer,
                };
                handler.handle(&mut ctx, r.get_data())?;
            }
        }
        return Ok(());
    }
}

pub struct StreamHandler<S> {
    transport: Transport<TcpStream, Builder<HeapAllocator>>,
    write_queue: VecDeque<Builder<HeapAllocator>>,
    core: HandlerCore<S>,
}

impl<S> StreamHandler<S> {
    pub fn new(core: HandlerCore<S>, stream: TcpStream) -> Self {
        StreamHandler {
            transport: Transport::new(stream, ReaderOptions::default()),
            write_queue: VecDeque::new(),
            core,
        }
    }

    pub fn writer<'a>(&'a mut self) -> Writer<'a> {
        Writer {
            write_queue: &mut self.write_queue,
        }
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

    fn handle_message<T>(&mut self, builder: Reader<T>)
        -> Result<(), capnp::Error>
        where T: ReaderSegments
    {
        let mut writer = Writer {
            write_queue: &mut self.write_queue,
        };
        let reader = builder.get_root::<network_message::Reader>()?;
        return self.core.handle(&mut writer, reader);
    }

    fn poll_transport(&mut self) -> Poll<(), capnp::Error> {
        while let Some(reader) = try_ready!(self.transport.poll()) {
            try!(self.handle_message(reader));
            try_ready!(self.flush_writes());
        }
        return Ok(Async::Ready(()));
    }

    fn poll_stream(&mut self) -> Poll<(), capnp::Error> {
        try_ready!(self.flush_writes());
        return self.poll_transport();
    }
}

type MessageHandler<S> = Box<
    for<'a, 'c>
        Handler<'a,
            MsgHandlerCtx<'a, 'c, S>,
            any_pointer::Owned, Output=(), Error=capnp::Error>
>;

pub struct MsgHandlerCtx<'a, 'w, S> {
    pub state: &'a mut S,
    pub writer: &'a mut Writer<'w>,
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

impl<'a, 'c, S,  M, F, T, E> Handler<'a, MsgHandlerCtx<'a, 'c, S>, M> for MsgHandler<M, F>
    where F: Fn(&mut S, &mut Writer, <M as Owned<'a>>::Reader) -> Result<T, E>,
          F: Send,
          M: Owned<'a> + 'static + Send
{
    type Output = T;
    type Error = E;

    fn handle(&self, ctx: &mut MsgHandlerCtx<'a, 'c, S>, reader: <M as Owned<'a>>::Reader)
        -> Result<T, E>
    {
        let MsgHandlerCtx { state, writer } = ctx;
        (self.function)(state, writer, reader)
    }
}

// TODO: replace this with a more general handle
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

