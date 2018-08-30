use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use super::connection_table::ConnectionTable;
use super::connection_handler::ConnectionHandle;

pub trait Router {
    fn route(&mut self, &[u8]) -> Result<usize, ()>;
    fn unregister(&mut self, usize);
}

pub struct ConnectionRouter<R: Router> {
    pub router: Arc<Mutex<R>>,
    pub connection_table: Arc<Mutex<ConnectionTable>>,
}

impl<R: Router> Clone for ConnectionRouter<R> {
    fn clone(&self) -> Self {
        ConnectionRouter {
            router: self.router.clone(),
            connection_table: self.connection_table.clone(),
        }
    }
}

impl<R: Router> ConnectionRouter<R> {
    pub fn route(&mut self, msg: &[u8]) -> Result<ConnectionHandle, ()> {
        let mut router = self.router.lock().unwrap();
        let connection_id = try!(router.route(msg));
        let mut connection_table = self.connection_table.lock().unwrap();
        let handle = connection_table.get(connection_id).unwrap();
        return Ok(handle);
    }
}

pub struct GameServerRouter {
    token_map: HashMap<Vec<u8>, usize>,
    inv_map: HashMap<usize, Vec<u8>>,
}

impl GameServerRouter {
    pub fn new() -> Self {
        GameServerRouter {
            token_map: HashMap::new(),
            inv_map: HashMap::new(),
        }
    }

    pub fn register(&mut self, token: Vec<u8>, connection_id: usize) {
        self.token_map.insert(token.clone(), connection_id);
        self.inv_map.insert(connection_id, token);
    }
}

impl Router for GameServerRouter {
    fn route(&mut self, token: &[u8]) -> Result<usize, ()> {
        if let Some(&connection_id) = self.token_map.get(token) {
            Ok(connection_id)
        } else {
            Err(())
        }
    }

    fn unregister(&mut self, connection_id: usize) {
        if let Some(token) = self.inv_map.remove(&connection_id) {
            self.token_map.remove(&token);
        }
    }
}