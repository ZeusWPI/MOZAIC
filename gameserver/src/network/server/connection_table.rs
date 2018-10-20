use std::collections::HashMap;

use network::lib::connection_handler::ConnectionHandle;
use sodiumoxide::crypto::sign::PublicKey;

#[derive(Debug, Clone, Copy, Hash, PartialEq, Eq)]
pub struct ClientId(u32);

impl ClientId {
    pub fn new(num: u32) -> ClientId {
        ClientId(num)
    }

    pub fn as_u32(&self) -> u32 {
        let ClientId(num) = *self;
        return num;
    }
}

#[derive(Clone)]
pub struct ConnectionData {
    pub connection_id: usize,
    pub handle: ConnectionHandle,
    pub public_key: PublicKey,
}

pub struct ConnectionTable {
    id_counter: usize,
    connections: HashMap<usize, ConnectionData>,
}

impl ConnectionTable {
    pub fn new() -> Self {
        ConnectionTable {
            id_counter: 0,
            connections: HashMap::new(),
        }
    }

    pub fn register(&mut self, public_key: PublicKey, handle: ConnectionHandle)
        -> usize
    {
        let connection_id = self.id_counter;
        self.id_counter += 1;

        self.connections.insert(connection_id, ConnectionData {
            connection_id,
            handle: handle.clone(),
            public_key,
        });

        return connection_id;
    }

    pub fn get<'a>(&'a mut self, connection_id: usize)
        -> Option<&'a ConnectionData>
    {
        self.connections.get(&connection_id)
    }

    pub fn get_mut<'a>(&'a mut self, connection_id: usize)
        -> Option<&'a mut ConnectionData>
    {
        self.connections.get_mut(&connection_id)
    }

    pub fn remove(&mut self, connection_id: usize) {
        self.connections.remove(&connection_id);
    }
}
