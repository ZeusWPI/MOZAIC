use std::collections::HashMap;
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};
use tokio::net::TcpStream;

use protobuf_codec::MessageStream;
use protocol;

pub enum RoutingMessage {
    Connecting {
        stream: MessageStream<TcpStream, protocol::Packet>,
    },
}

pub struct RoutingTable {
    routing_channels: HashMap<Vec<u8>, UnboundedSender<RoutingMessage>>,
}

impl RoutingTable {
    pub fn new() -> Self {
        RoutingTable {
            routing_channels: HashMap::new(),
        }
    }

    pub fn register(&mut self, token: &[u8]) -> UnboundedReceiver<RoutingMessage> {
        let (tx, rx) = unbounded();
        self.routing_channels.insert(token.to_vec(), tx);
        return rx;
    }

    pub fn get(&mut self, token: &[u8]) -> Option<UnboundedSender<RoutingMessage>> {
        self.routing_channels.get(token).cloned()
    }

    pub fn remove(&mut self, token: &[u8]) {
        self.routing_channels.remove(token);
    }
}