use std::sync::{Arc, Mutex};

use network::{ConnectionTable, ConnectionHandle, Router};
use reactors::EventHandler;

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

    pub fn create_connection<H, F>(&mut self, token: Vec<u8>, creator: F)
        -> ConnectionHandle
        where F: FnOnce(ConnectionHandle) -> H,
              H: EventHandler + Send + 'static
    {
        let mut table = self.connection_table.lock().unwrap();
        let mut router = self.router.lock().unwrap();
        let connection_id = table.create(creator);
        router.register(token, connection_id);
        return table.get(connection_id).unwrap();
    }

    pub fn unregister(&mut self, connection_id: usize) {
        let mut router = self.router.lock().unwrap();
        router.unregister(connection_id);
        let mut table = self.connection_table.lock().unwrap();
        table.remove(connection_id);
    }
}