use std::collections::HashMap;
use prost::Message;
use protocol as proto;
use std::io::{Error, ErrorKind};

use reactors::RequestHandler;
use network::server::{Router, Routing, BoxedSpawner};

use sodiumoxide::crypto::sign::PublicKey;

use super::control_handler::ControlHandler;
use super::connection_manager::ConnectionManager;

// length requirement for control tokens
const CONTROL_TOKEN_NUM_BYTES: usize = 64;

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

#[derive(PartialEq, Eq, Hash, Clone)]
enum GameserverConnection {
    ServerControl {
        conn_uuid: Vec<u8>,
    },
    MatchControl {
        match_uuid: Vec<u8>
    },
    Client {
        match_uuid: Vec<u8>,
        client_id: u32,
    }
}


pub struct GameServerRouter {
    owner_public_key: PublicKey,

    // map router connection ids to internal connection ids
    connections: HashMap<GameserverConnection, usize>,
    /// inverse mapping for unregistering
    inv: HashMap<usize, GameserverConnection>,
}

impl GameServerRouter {
    pub fn new(owner_public_key: PublicKey) -> Self {
        GameServerRouter {
            owner_public_key,
            connections: HashMap::new(),
            inv: HashMap::new(),
        }
    }

    fn insert(&mut self, conn_id: usize, conn: GameserverConnection) {
        self.connections.insert(conn.clone(), conn_id);
        self.inv.insert(conn_id, conn);
    }

    fn remove(&mut self, conn_id: usize) {
        if let Some(conn) = self.inv.remove(&conn_id) {
            self.connections.remove(&conn);
        }
    }

    pub fn register_client(
        &mut self,
        match_uuid: Vec<u8>,
        client_id: u32,
        connection_id: usize
    ) {
        let router_id = GameserverConnection::Client {
            match_uuid,
            client_id,
        };
        self.insert(connection_id, GameserverConnection::Client {
            match_uuid,
            client_id,
        });
    }

    pub fn register_match_control(
        &mut self,
        match_uuid: Vec<u8>,
        connection_id: usize)
    {
        self.insert(connection_id, GameserverConnection::MatchControl {
            match_uuid,
        });
    }

    pub fn register_server_control(
        &mut self,
        conn_uuid: Vec<u8>,
        connection_id: usize
    ) {
        self.insert(connection_id, GameserverConnection::ServerControl {
            conn_uuid,
        });
    }
}

impl Router for GameServerRouter {
    fn route(&self, message: &[u8]) -> Result<Routing<Self>, Error> {
        let connect = try!(proto::GameserverConnect::decode(message));

        match connect.connect.unwrap() {
            proto::gameserver_connect::Connect::Client(c) => {
                let conn_id = GameserverConnection::Client {
                    match_uuid: c.match_uuid,
                    client_id: c.client_id,
                };
                self.connections.get()
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
                if c.uuid.len() != CONTROL_TOKEN_NUM_BYTES {
                    return Err(Error::new(
                        ErrorKind::Other,
                        "invalid token",
                    ));
                }
                if let Some(&conn_id) = self.control_connections.get(&c.uuid) {
                    return Ok(Routing::Connect(conn_id));
                } else {
                    return Ok(Routing::CreateConnection {
                        public_key: self.owner_public_key.clone(),
                        spawner: BoxedSpawner::new(
                            move |router: &mut GameServerRouter, conn_id| {
                                router.register_server_control(
                                    c.uuid.clone(),
                                    conn_id
                                );
                            },
                            |handle, router| {
                                let handler = ControlHandler::new(
                                    handle,
                                    ConnectionManager::new(router.clone()),
                                );
                                let mut core = RequestHandler::new(handler);
                                core.add_handler(ControlHandler::create_match);
                                core.add_handler(ControlHandler::quit);
                                return core;
                            },
                        ),
                    });
                }
            }
        }
    }

    fn unregister(&mut self, connection_id: usize) {
        self.remove(connection_id);
    }
}
