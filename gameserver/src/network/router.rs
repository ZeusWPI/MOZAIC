use std::collections::HashMap;
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use tokio::net::TcpStream;

use protobuf_codec::MessageStream;
use protocol;

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


pub enum RoutingMessage {
    Connecting {
        stream: MessageStream<TcpStream, protocol::Packet>,
    },
}

#[derive(Clone)]
pub struct ConnectionData {
    pub routing_channel: UnboundedSender<RoutingMessage>,
    pub client_id: ClientId,
}

pub struct RoutingTable {
    connections: HashMap<Vec<u8>, ConnectionData>,
}

impl RoutingTable {
    pub fn new() -> Self {
        RoutingTable {
            connections: HashMap::new(),
        }
    }

    pub fn register(&mut self, token: &[u8], client_id: ClientId)
        -> UnboundedReceiver<RoutingMessage>
    {
        let (tx, rx) = unbounded();
        let connection_data = ConnectionData {
            client_id,
            routing_channel: tx,
        };
        self.connections.insert(token.to_vec(), connection_data);
        return rx;
    }

    pub fn get(&mut self, token: &[u8])
        -> Option<ConnectionData>
    {
        self.connections.get(token).cloned()
    }

    pub fn remove(&mut self, token: &[u8]) {
        self.connections.remove(token);
    }
}