use std::collections::HashMap;

use network::connection_router::Router;


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