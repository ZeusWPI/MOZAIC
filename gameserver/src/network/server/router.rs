use std::io;
use std::marker::PhantomData;

use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

use reactors::{WireEvent, EventHandler};

use network::lib::{ConnectionHandler, ConnectionHandle, RegisteredConnectionHandle};



pub trait Router {
    fn route(&self, &[u8]) -> Result<Routing<Self>, io::Error>;
    fn unregister(&mut self, usize);
}

pub trait RouterRegistration {
    type Router;

    fn register(self, router: &mut Self::Router, connection_id: usize);
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
        public_key: PublicKey,
        spawner: Box<ConnectionSpawner<R>>,
    }
}

pub struct ConnectionCreator<R: ?Sized> {
    spawner: Box<ConnectionSpawner<R> + Send>,
}

impl<R> ConnectionCreator<R>
    where R: Send + 'static
{
    pub fn new<H, F>(func: F) -> Self
        where H: EventHandler<Output = io::Result<WireEvent>>,
              F: FnMut(RegisteredConnectionHandle, &mut R) -> H + Send + 'static,
              H: Send + 'static,

    {
        ConnectionCreator {
            spawner: Box::new(
                CreateConnectionWrapper::new(func)
            )
        }
    }

    pub fn create_connection(
        &mut self,
        public_key: PublicKey,
        routing_table: &mut RoutingTableHandle<R>,
    ) -> ConnectionHandle
    {
        self.spawner.create_connection(public_key, routing_table)
    }
}

trait ConnectionSpawner<R> {
    fn create_connection(
        &mut self,
        public_key: PublicKey,
        routing_table: &mut RoutingTableHandle<R>,
    ) -> ConnectionHandle;
}

pub struct CreateConnectionWrapper<R: ?Sized, H, F>
    where H: EventHandler<Output = io::Result<WireEvent>>,
          F: FnMut(RegisteredConnectionHandle, &mut R) -> H
{
    creator: F,
    phantom_r: PhantomData<R>,
    phantom_h: PhantomData<H>,
}

impl<R, H, F> CreateConnectionWrapper<R, H, F>
    where H: EventHandler<Output = io::Result<WireEvent>>,
          F: FnMut(RegisteredConnectionHandle, &mut R) -> H + 'static,
          H: Send + 'static
{
    pub fn new(func: F) -> Self {
        CreateConnectionWrapper {
            creator: func,
            phantom_r: PhantomData,
            phantom_h: PhantomData,
        }
    }
}


impl<R, H, F> ConnectionSpawner<R> for CreateConnectionWrapper<R, H, F>
    where H: EventHandler<Output = io::Result<WireEvent>>,
          F: FnMut(RegisteredConnectionHandle, &mut R) -> H,
          R: Send + 'static,
          H: Send + 'static
{
    fn create_connection(
        &mut self,
        public_key: PublicKey,
        routing_table: &mut RoutingTableHandle<R>,
    ) -> ConnectionHandle
    {
        ConnectionHandler::create(|handle| {
            let registered_handle = routing_table.register(handle);

            // TODO: register connection
            let registered_handle = unimplemented!();

            (self.creator)(registered_handle, router)
        });

        unimplemented!()
    }
}