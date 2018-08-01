use std::collections::HashMap;
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};

use super::connection_handler::{ConnectionHandler, ConnectionHandle};
use reactors::ReactorCore;
use tokio;

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

pub struct ConnectionTable {
    connections: HashMap<Vec<u8>, ConnectionHandle>,
}

impl ConnectionTable {
    pub fn new() -> Self {
        ConnectionTable {
            connections: HashMap::new(),
        }
    }

    pub fn create<S>(&mut self, token: &[u8], core: ReactorCore<S>)
        -> ConnectionHandle
        where S: Send + 'static
    {
        let (handle, handler) = ConnectionHandler::new(core);
        tokio::spawn(handler);
        self.connections.insert(token.to_vec(), handle.clone());
        return handle;
    }

    pub fn get(&mut self, token: &[u8])
        -> Option<ConnectionHandle>
    {
        self.connections.get(token).cloned()
    }

    pub fn remove(&mut self, token: &[u8]) {
        self.connections.remove(token);
    }
}