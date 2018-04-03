use std::collections::HashMap;
use futures::{Future, Poll, Stream};
use futures::sync::mpsc::UnboundedSender;
use client_controller::Command as ClientControllerCommand;

pub struct RoutingTable {
    connection_handles: HashMap<Vec<u8>, UnboundedSender<ClientControllerCommand>>,
}

impl RoutingTable {
    pub fn new() -> Self {
        RoutingTable {
            connection_handles: HashMap::new(),
        }
    }

    pub fn insert(&mut self, token: Vec<u8>, handle: &UnboundedSender<ClientControllerCommand>) {
        self.connection_handles.insert(token, handle.clone());
    }

    pub fn get(&mut self, token: &[u8]) -> Option<UnboundedSender<ClientControllerCommand>> {
        self.connection_handles.get(token).cloned()
    }

    pub fn remove(&mut self, token: &[u8]) {
        self.connection_handles.remove(token);
    }
}