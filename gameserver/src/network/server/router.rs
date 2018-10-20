use std::io;
use std::marker::PhantomData;
use tokio;

use sodiumoxide::crypto::sign::PublicKey;

use reactors::{WireEvent, EventHandler};

use network::lib::{ConnectionHandler, ConnectionHandle};
use super::routing_table::{
    RoutingTableHandle,
    RegisteredHandle,
};


pub trait Router {
    fn route(&self, &[u8]) -> io::Result<Routing<Self>>;
    fn unregister(&mut self, usize);
}

// The reason that we return a 'creator' instead of just directly creating
// a connection is that a connecting transport is not authenticated when routing
// happens. This is, of course, because we need to know who we have to
// authenticate before we can actually do so. 
// Suppose an intruder tries to open a new connection. If the connection would
// be opened right away, we would be stuck with an open connection that nobody
// can connect to (because the intruder cannot authenticate).
// With this 'creator', we can delay the creation of a connection until the
// handshake has been completed.
pub enum Routing<R>
    where R: Router + ?Sized
{
    Connect(usize),
    CreateConnection {
        spawner: BoxedSpawner<R>,
        public_key: PublicKey,
    },
}

pub struct BoxedSpawner<R: ?Sized> {
    spawner: Box<ConnectionSpawner<R>>,
}

impl<R: 'static> BoxedSpawner<R> {
    pub fn new<F, C, H>(register_fn: F, create_fn: C) -> Self
        where F: FnOnce(&mut R, usize) + Send + 'static,
              C: FnOnce(RegisteredHandle, &mut RoutingTableHandle<R>) -> H,
              C: Send + 'static,
              H: EventHandler<Output = io::Result<WireEvent>> + Send + 'static,
              R: Router + Send + 'static
    {
        BoxedSpawner {
            spawner: Box::new(ConnectionCreator::new(register_fn, create_fn))
        }
    }

    pub fn spawn(
        self,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey,
    ) -> ConnectionHandle
    {
        self.spawner.spawn_connection(routing_table, public_key)
    }
}

trait ConnectionSpawner<R> : Send + 'static {
    fn spawn_connection(self: Box<Self>, &mut RoutingTableHandle<R>, public_key: PublicKey)
        -> ConnectionHandle;
}

struct ConnectionCreator<R, F, C, H> {
    phantom_r: PhantomData<R>,
    phantom_h: PhantomData<H>,
    register_fn: F,
    create_fn: C,
}

impl<R, F, C, H> ConnectionCreator<R, F, C, H>
    where F: FnOnce(&mut R, usize),
          C: FnOnce(RegisteredHandle, &mut RoutingTableHandle<R>) -> H,
          H: EventHandler<Output = io::Result<WireEvent>>,
          R: Router + Send + 'static,
{
    pub fn new(register_fn: F, create_fn: C) -> Self {
        ConnectionCreator {
            phantom_r: PhantomData,
            phantom_h: PhantomData,
            register_fn,
            create_fn,
        }
    }

    fn create_connection(
        self,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey,
    ) -> (ConnectionHandle, ConnectionHandler<H>)
    {
        ConnectionHandler::create(|handle| {
            let registered_handle = routing_table.register(
                handle,
                public_key,
                self.register_fn,
            );

            return (self.create_fn)(registered_handle, routing_table);
        })
    }
}

impl<R, F, C, H> ConnectionSpawner<R> for ConnectionCreator<R, F, C, H>
    where F: FnOnce(&mut R, usize),
          F: Send + 'static,
          C: FnOnce(RegisteredHandle, &mut RoutingTableHandle<R>) -> H,
          C: Send + 'static,
          H: EventHandler<Output = io::Result<WireEvent>> + Send + 'static,
          R: Router + Send + 'static,
{
    fn spawn_connection(
        self: Box<Self>,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey,
    ) -> ConnectionHandle
    {
        let (handle, handler) = self.create_connection(
            routing_table,
            public_key
        );
        tokio::spawn(handler);
        return handle;
    }
}
