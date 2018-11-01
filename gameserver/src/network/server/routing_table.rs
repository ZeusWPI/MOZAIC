use std::io;
use std::sync::{Arc, Mutex};
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

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

impl<R> RoutingTable<R> {
    pub fn new(router: R, secret_key: SecretKey) -> RoutingTableHandle<R> {
        let table = RoutingTable {
            connections: ConnectionTable::new(),
            router,
            secret_key
        };
        return RoutingTableHandle {
            routing_table: Arc::new(Mutex::new(table)),
        };
    }
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

    pub fn apply<F, T>(&mut self, fun: F) -> T
        where F: FnOnce(&mut RoutingTable<R>) -> T
    {
        let mut table = self.routing_table.lock().unwrap();
        return fun(&mut table);
    }

    pub fn route(&mut self, msg: &[u8])
        -> Result<ConnectionRouting<R>, io::Error>
    {
        let mut table = self.routing_table.lock().unwrap();
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
        where F: FnOnce(&mut R, usize),
              R: Send + 'static
    {
        let mut table = self.routing_table.lock().unwrap();

        let connection_id = table.connections
            .register(public_key, connection_handle.clone());
        register_fn(&mut table.router, connection_id);
    
        return RegisteredHandle {
            connection_handle,
            connection_id,

            registrar: Box::new(self.clone()),
        };
    }
}

trait ConnectionRegistrar : Send + 'static {
    fn unregister(&mut self, conn_id: usize);
}

pub struct RegisteredHandle {
    connection_handle: ConnectionHandle,
    connection_id: usize,

    registrar: Box<ConnectionRegistrar>,
}

impl RegisteredHandle {
    pub fn send(&mut self, data: Vec<u8>) {
        self.connection_handle.send(data);
    }
}

impl Drop for RegisteredHandle {
    fn drop(&mut self) {
        self.registrar.unregister(self.connection_id);
    }
}

impl<R> ConnectionRegistrar for RoutingTableHandle<R>
    where R: Router + Send + 'static
{
    fn unregister(&mut self, conn_id: usize) {
        self.apply(|routing_table| {
            routing_table.connections.remove(conn_id);
            routing_table.router.unregister(conn_id);
        })
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
    pub fn connect(mut self, channel: Channel, keys: SessionKeys) {
        match self.target {
            RoutingTarget::Connection(connection_id) => {
                self.routing_table.apply(|table| {
                    table.connections
                        .get_mut(connection_id)
                        .unwrap()
                        .handle
                        .connect(channel, keys);
                });
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
