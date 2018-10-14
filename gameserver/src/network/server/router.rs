use std::io;
use std::marker::PhantomData;
use tokio;

use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

use reactors::{WireEvent, EventHandler};

use network::lib::{ConnectionHandler, ConnectionHandle, RegisteredConnectionHandle};
use super::routing_table::{
    RoutingTableHandle,
};



pub trait Router {
    type Registration;
    
    fn route(&self, &[u8]) -> Result<Self::Routing, io::Error>;
    fn register(&mut self, usize, Self::Registration);
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
    Connect { connection_id: usize }
    CreateConnection {
        creator: CreateConnection<R>,
        public_key: PublicKey,
    },
}

pub struct CreateConnection<R>
    where R: Router
{
    pub registration: R::Registration,
    pub creator: Box<ConnectionCreator<R>>,
}

impl<R> CreateConnection<R> {
    pub fn new<H, C>(
        registration: R::Registration,
        creator: C
    ) -> Self
        where C: FnMut(RegisteredConnectionHandle, &mut R) -> H,
              H: EventHandler<Output = io::Result<WireEvent>>,
    {
        CreateConnection {
            registration,
            creator: ConnectionSpawner::new(creator),
        }
    }

    pub fn create(self,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey
    ) -> ConnectionHandle
    {
        self.spawner.spawn_connection(
            routing_table,
            public_key,
            self.registration
        )
    }
}

trait ConnectionCreator<R> {
    fn spawn_connection(
        &mut self,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey,
        router_registration: R::Registration,
    ) -> ConnectionHandle;
}

pub struct ConnectionSpawner<R, H, C> {
    phantom_r: PhantomData<R>,
    phantom_h: PhantomData<H>,
    handle_creator: C,
}

impl<R, H, C> ConnectionSpawner<R, H, C>
    where R: Router,
          C: FnMut(RegisteredConnectionHandle, &mut R) -> H,
          H: EventHandler<Output = io::Result<WireEvent>>,
{
    pub fn new(creator: C) -> Self {
        ConnectionSpawner {
            phantom_r: PhantomData,
            phantom_h: PhantomData,
            handle_creator: creator,
        }
    }
}

impl<R, H, C> ConnectionCreator<R> for ConnectionSpawner<R, H, C>
    where R: Router,
          C: FnMut(RegisteredConnectionHandle, &mut R) -> H,
          H: EventHandler<Output = io::Result<WireEvent>>,
{
    fn spawn_connection(
        &mut self,
        routing_table: &mut RoutingTableHandle<R>,
        public_key: PublicKey,
        router_registration: R::Registration
    ) -> ConnectionHandle
    {
        let (handle, handler) = ConnectionHandler::create(|handle| {
            let registered_handle = routing_table.register(
                handle,
                public_key,
                router_registration,
            );

            return self.handle_creator(registered_handle, routing_table);
        });

        tokio::spawn(handler);
        return handle;
    }
}
