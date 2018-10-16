use std::io;
use std::sync::{Arc, Mutex};
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};
use reactors::{Event};

use network::lib::ConnectionHandle;
use network::lib::channel::Channel;
use network::lib::crypto::SessionKeys;
use super::connection_table::ConnectionTable;

use super::router::{Router, Routing, BoxedSpawner};


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
            Routing::Connect(connection_id) => {
                let public_key = table.connections.get(connection_id)
                    .unwrap()
                    .public_key
                    .clone();
                ConnectionRouting {
                    public_key,
                    routing_table: self.clone(),
                    target: RoutingTarget::Connection(connection_id),
                }
            }
            Routing::CreateConnection { public_key, spawner } => {
                ConnectionRouting {
                    public_key,
                    routing_table: self.clone(),
                    target: RoutingTarget::CreateConnection(spawner),
                }
            }
        };
        return Ok(conn_routing);
    }
    
    pub fn connection_handle<'a>(&'a mut self, connection_id: usize)
        -> &'a mut ConnectionHandle
    {
        let table = self.routing_table.lock().unwrap();
        return &mut table.connections.get_mut(connection_id).unwrap().handle;
    }

    pub fn get_secret_key(&self) -> SecretKey {
        let table = self.routing_table.lock().unwrap();
        // clone to avoid keeping connection table locked
        return table.secret_key.clone();
    }

    pub fn register<F>(
        &mut self,
        connection_handle: ConnectionHandle,
        public_key: PublicKey,
        register_fn: F,
    ) -> RegisteredHandle
        where F: FnOnce(&mut R, usize)
    {
        let table = self.routing_table.lock().unwrap();

        let connection_id = table.connections
            .register(public_key, connection_handle.clone());
        register_fn(&mut table.router, connection_id);
    
        return RegisteredHandle {
            connection_handle,
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
    routing_table: RoutingTableHandle<R>,
    target: RoutingTarget<R>,
}

enum RoutingTarget<R> {
    Connection(usize),
    CreateConnection(BoxedSpawner<R>),
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
        match self.target {
            RoutingTarget::Connection(connection_id) => {
                self.routing_table.connection_handle(connection_id)
                    .connect(channel, keys);
            }
            RoutingTarget::CreateConnection(spawner) => {
                spawner.spawn(
                    &mut self.routing_table,
                    self.public_key,
                ).connect(channel, keys);
            }
        }
    }
}
