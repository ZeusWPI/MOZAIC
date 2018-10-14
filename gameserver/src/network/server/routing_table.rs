use std::io;
use std::sync::{Arc, Mutex};
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};
use reactors::{Event, EventBox, WireEvent, EventHandler};
use std::marker::PhantomData;

use network::lib::{ConnectionHandler, ConnectionHandle};
use network::lib::channel::Channel;
use network::lib::crypto::SessionKeys;
use super::connection_table::ConnectionTable;

use super::router::{Router, Routing, CreateConnection};


// TODO: this is all really ugly and unhygienic
// please fix and wash hands


pub struct RoutingTable<R> {
    connections: ConnectionTable,
    router: R,
    secret_key: SecretKey,
}

pub struct RoutingTableHandle<R> {
    routing_table: Arc<Mutex<RoutingTable<R>>>,
}

impl<R> Clone for RoutingTableHandle<R> {
    fn clone(&self) -> Self {
        RoutingTableHandle {
            routing_table: self.routing_table.clone(),
        }
    }
}


impl<R> RoutingTableHandle<R>
    where R: Router
{
    pub fn route(&mut self, msg: &[u8])
        -> Result<ConnectionRouting<R>, io::Error>
    {
        let table = self.routing_table.lock().unwrap();
        let routing = try!(table.router.route(msg));

        let conn_routing = match routing {
            Routing::Connect(conn_id) => {
                let public_key = table.connections.get(conn_id)
                    .unwrap()
                    .public_key
                    .clone();
                ConnectionRouting {
                    public_key,
                    router: self.clone(),
                    target: RoutingTarget::Connection(conn_id),
                }
            }
            Routing::CreateConnection { public_key, creator } => {
                ConnectionRouting {
                    public_key,
                    router: self.clone(),
                    target: RoutingTarget::NewConnection(creator),
                }
            }
        };
        return Ok(conn_routing);
    }

    pub fn register(
        &mut self,
        handle: ConnectionHandle,
        public_key: PublicKey,
        router_registration: R::Registration
    ) -> RegisteredHandle
    {
        let table = self.routing_table.lock().unwrap();

        let connection_id = table.connections
            .register(public_key, handle.clone());
        router_registration.register(&mut table.router, connection_id);
    
        return RegisteredHandle {
            handle,
            connection_id,
        };
    }

    fn unregister(&mut self, conn_id: usize) {
        let table = self.routing_table.lock().unwrap();
        
        table.connections.remove(conn_id);
        table.router.unregister(conn_id);
    }
}

pub struct RegisteredHandle {
    connection_handle: ConnectionHandle,
    connection_id: usize,
}

impl RegisteredHandle {
    pub fn dispatch<E>(&mut self, event: E)
        where E: Event
    {
        self.connection_handle.dispatch(event);
    }
}


pub struct ConnectionRouting<R>
    where R: Router
{
    public_key: PublicKey,
    router: RoutingTableHandle<R>,
    target: RoutingTarget<R>,
}

enum RoutingTarget<R> {
    Connection {
        connection_id: usize,
    }
    NewConnection(CreateConnection<R>),
}

impl<R> ConnectionRouting<R>
    where R: Router
{
    pub fn public_key<'a>(&'a self) -> &'a PublicKey {
        &self.public_key
    }
}


impl<R> ConnectionRouting<R>
    where R: Router + 'static + Send
{
    pub fn connect(self, channel: Channel, keys: SessionKeys) {
        let mut table = self.router.routing_table.lock().unwrap();

        match self.target {
            RoutingTarget::Connection(conn_id) => {
                table.connections.get_mut(conn_id)
                    .unwrap()
                    .handle
                    .connect(channel, keys);
            }
            RoutingTarget::NewConnection(mut creator) => {
                creator.create_connection(
                    self.public_key,
                    &mut table.connections,
                    &mut table.router,
                ).connect(channel, keys);
            }
        }
    }
}
