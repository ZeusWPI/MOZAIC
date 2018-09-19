use std::collections::HashMap;
use prost::Message;
use protocol as proto;
use std::io::{Error, ErrorKind};

use network::connection_router::{Router, Routing};

struct ConnectionData {
    match_uuid: Vec<u8>,
    client_id: u32,
}

pub struct GameServerRouter {
    control_connection: Option<usize>,
    /// maps match uuid to a (client_id -> connection_id) mapping
    matches: HashMap<Vec<u8>, HashMap<u32, usize>>,
    client_connections: HashMap<usize, ConnectionData>,
}

impl GameServerRouter {
    pub fn new() -> Self {
        GameServerRouter {
            control_connection: None,
            matches: HashMap::new(),
            client_connections: HashMap::new(),
        }
    }

    pub fn register_client(
        &mut self,
        match_uuid: Vec<u8>,
        client_id: u32,
        connection_id: usize
    ) {
        let match_clients = self.matches
            .entry(match_uuid.clone())
            .or_insert_with(|| HashMap::new());
        match_clients.insert(client_id, connection_id);
        self.client_connections.insert(connection_id, ConnectionData {
            match_uuid,
            client_id,
        });
    }

    pub fn register_control_connection(&mut self, connection_id: usize) {
        self.control_connection = Some(connection_id);
    }
}

impl Router for GameServerRouter {
    fn route(&self, message: &[u8]) -> Result<Routing<Self>, Error> {
        let connect = try!(proto::GameserverConnect::decode(message));
        match connect.connect.unwrap() {
            proto::gameserver_connect::Connect::Client(c) => {
                self.matches
                    .get(&c.match_uuid)
                    .and_then(|match_clients| {
                        match_clients.get(&c.client_id)
                    })
                    .map(|&conn_id| Routing::Connect(conn_id))
                    .ok_or_else(|| Error::new(
                        ErrorKind::Other, 
                        "unknown client")
                    )
            }
            proto::gameserver_connect::Connect::ServerControl(_) => {
                self.control_connection
                    .map(|conn_id| Routing::Connect(conn_id))
                    .ok_or_else(|| Error::new(
                        ErrorKind::Other,
                        "no control connection registered")
                    )

            }
        }
    }

    fn unregister(&mut self, connection_id: usize) {
        if self.control_connection == Some(connection_id) {
            // this is not really supposed to happen, but sure.
            self.control_connection = None;
        }

        if let Some(data) = self.client_connections.remove(&connection_id) {
            // TODO: ewwwwwwwwww
            let is_empty = {
                let match_clients = self.matches
                    .get_mut(&data.match_uuid)
                    .unwrap();
                match_clients.remove(&data.client_id);
                match_clients.is_empty()
            };
            if is_empty {
                self.matches.remove(&data.match_uuid);
            }
        }
    }
}