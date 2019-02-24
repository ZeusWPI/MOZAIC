use tokio;

use network::server::{RoutingTableHandle};
use network::server::RegisteredHandle;
use network::lib::{Connection, ConnectionHandler};
use sodiumoxide::crypto::sign::PublicKey;

use super::GameServerRouter;

#[derive(Clone)]
pub struct ConnectionManager {
    routing_table: RoutingTableHandle<GameServerRouter>,
}

impl ConnectionManager {
    pub fn new(routing_table: RoutingTableHandle<GameServerRouter>) -> Self
    {
        ConnectionManager {
            routing_table,
        }
    }

    // TODO: less params please :(  
    pub fn create_client<H>(
        &mut self,
        match_uuid: Vec<u8>,
        client_id: u32,
        public_key: PublicKey,
        handler: H,
    ) -> RegisteredHandle
        where H: ConnectionHandler,
              H: Send + 'static
    {
        let (conn_handle, conn_handler) = Connection::new(handler);
        tokio::spawn(conn_handler);

        return self.routing_table.register(
            conn_handle,
            public_key,
            |router, conn_id| {
                router.register_client(match_uuid, client_id, conn_id);
            }
        );
    }
}
