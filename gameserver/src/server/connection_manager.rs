use std::sync::{Arc, Mutex};
use std::io;

use network::{ConnectionTable, ConnectionHandle, Router};
use reactors::{WireEvent, EventHandler};

use super::GameServerRouter;

#[derive(Clone)]
pub struct ConnectionManager {
    router: Arc<Mutex<GameServerRouter>>,
    connection_table: Arc<Mutex<ConnectionTable>>,
}

impl ConnectionManager {
    pub fn new(connection_table: Arc<Mutex<ConnectionTable>>,
               router: Arc<Mutex<GameServerRouter>>)
               -> Self
    {
        ConnectionManager {
            connection_table,
            router,
        }
    }

    // TODO: less params please :(  
    pub fn create_connection<H, F>(
        &mut self,
        match_uuid: Vec<u8>,
        client_id: u32,
        token: Vec<u8>,
        creator: F
    ) -> ConnectionHandle
        where F: FnOnce(ConnectionHandle) -> H,
              H: EventHandler<Output = io::Result<WireEvent>>,
              H: Send + 'static
    {
        let mut table = self.connection_table.lock().unwrap();
        let mut router = self.router.lock().unwrap();
        let connection_id = table.create(token.clone(), creator);
        router.register_client(match_uuid, client_id, connection_id);
        return table.get(connection_id).unwrap().handle.clone();
    }

    pub fn unregister(&mut self, connection_id: usize) {
        let mut router = self.router.lock().unwrap();
        router.unregister(connection_id);
        let mut table = self.connection_table.lock().unwrap();
        table.remove(connection_id);
    }
}