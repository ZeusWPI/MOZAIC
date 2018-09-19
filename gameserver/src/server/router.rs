use std::collections::HashMap;
use prost::Message;
use protocol as proto;
use std::io::{Error, ErrorKind};
use std::sync::{Arc, Weak, Mutex};

use reactors::RequestHandler;
use network::ConnectionTable;
use network::connection_router::{Router, Routing, ConnectionCreator};

use sodiumoxide::crypto::sign::PublicKey;

use super::control_handler::ControlHandler;
use super::connection_manager::ConnectionManager;

enum ConnectionData {
    Client {
        match_uuid: Vec<u8>,
        client_id: u32,
    },
    Control {
        uuid: Vec<u8>,
    },
}

pub struct GameServerRouter {
    connection_table: Arc<Mutex<ConnectionTable>>,
    // TODO: How do we do this in a cleaner fashion?
    self_reference: Weak<Mutex<GameServerRouter>>,

    owner_public_key: PublicKey,

    /// maps control connection uuid to connection id
    control_connections: HashMap<Vec<u8>, usize>,
    /// maps match uuid to a (client_id -> connection_id) mapping
    matches: HashMap<Vec<u8>, HashMap<u32, usize>>,

    /// inverse mapping for unregistering
    connections: HashMap<usize, ConnectionData>,
}

impl GameServerRouter {
    pub fn create(
        connection_table: Arc<Mutex<ConnectionTable>>,
        owner_public_key: PublicKey,
    ) -> Arc<Mutex<Self>>
    {
        let router = GameServerRouter {
            owner_public_key,
            connection_table,
            self_reference: Weak::new(),
            control_connections: HashMap::new(),
            matches: HashMap::new(),
            connections: HashMap::new(),
        };
        // bootstrap self-reference
        let mutex = Arc::new(Mutex::new(router));
        mutex.lock().unwrap().self_reference = Arc::downgrade(&mutex);
        return mutex;
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
        self.connections.insert(connection_id, ConnectionData::Client {
            match_uuid,
            client_id,
        });
    }

    fn register_control(&mut self, uuid: Vec<u8>, connection_id: usize) {
        self.control_connections.insert(uuid.clone(), connection_id);
        self.connections.insert(
            connection_id,
            ConnectionData::Control { uuid }
        );
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
            proto::gameserver_connect::Connect::Control(c) => {
                if let Some(&conn_id) = self.control_connections.get(&c.uuid) {
                    return Ok(Routing::Connect(conn_id));
                } else {
                    // TODO: THIS IS AN ACTUAL SPAWN OF SATAN

                    let creator = ConnectionCreator::new(move |handle, router: &mut GameServerRouter| {            
                        let conn_manager = ConnectionManager::new(
                            router.connection_table.clone(),
                            router.self_reference.upgrade().unwrap(),
                        );

                        let handler = ControlHandler::new(
                            handle,
                            conn_manager,
                        );
                        let mut core = RequestHandler::new(handler);
                        core.add_handler(ControlHandler::create_match);
                        core.add_handler(ControlHandler::quit);
                        return core;
                    });

                    return Ok(Routing::CreateConnection {
                        public_key: self.owner_public_key.clone(),
                        creator,
                    })
                }
            }
        }
    }

    fn unregister(&mut self, connection_id: usize) {
        if let Some(data) = self.connections.remove(&connection_id) {
            match data {
                ConnectionData::Control { uuid } => {
                    self.control_connections.remove(&uuid);
                }
                ConnectionData::Client { match_uuid, client_id } => {
                    // TODO: ewwwwwwwwww
                    let is_empty = {
                        let match_clients = self.matches
                            .get_mut(&match_uuid)
                            .unwrap();
                        match_clients.remove(&client_id);
                        match_clients.is_empty()
                    };
                    if is_empty {
                        self.matches.remove(&match_uuid);
                    }
                }
            }
        }
    }
}