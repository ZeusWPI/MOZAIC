pub mod control_handler;
pub mod router;
pub mod connection_manager;
pub mod match_handler;

pub use self::router::GameServerRouter;
pub use self::connection_manager::ConnectionManager;

use utils::hex_serializer;

use futures::{Future, Poll, Async};
use std::sync::{Arc, Mutex};
use tokio;

use network;
use network::connection_table::ConnectionTable;
use network::connection_router::ConnectionRouter;
use reactors::RequestHandler;
use sodiumoxide::crypto::sign::{SecretKey, PublicKey};

use self::control_handler::ControlHandler;


#[derive(Serialize, Deserialize)]
pub struct Config {
    pub address: String,

    #[serde(with="hex_serializer")]
    pub public_key: Vec<u8>,
    #[serde(with="hex_serializer")]
    pub private_key: Vec<u8>,
}

pub struct Server {
    config: Config,
}

impl Server {
    pub fn new(config: Config) -> Self {
        Server {
            config,
        }
    }
}

impl Future for Server {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let connection_table = Arc::new(Mutex::new(ConnectionTable::new()));
        let router = Arc::new(Mutex::new(GameServerRouter::new()));

        let connection_manager = ConnectionManager::new(
            connection_table.clone(),
            router.clone()
        );

        let control_pubkey = PublicKey::from_slice(&self.config.public_key)
            .expect("invalid public key");
        let secret_key = SecretKey::from_slice(&self.config.private_key)
            .expect("invalid secret key");

        let control_connection = connection_table.lock().unwrap().create(
            control_pubkey,
            |handle| {
                let handler = ControlHandler::new(
                    handle,
                    connection_manager.clone(),
                );
                let mut core = RequestHandler::new(handler);
                core.add_handler(ControlHandler::create_match);
                core.add_handler(ControlHandler::quit);
                return core;
            }
        );

        router.lock()
            .unwrap()
            .register_control_connection(control_connection);

        let addr = self.config.address.parse().unwrap();
        let connection_router = ConnectionRouter {
            router,
            connection_table,
            secret_key,
        };
        match network::tcp::Listener::new(&addr, connection_router) {
            Ok(listener) => {
                tokio::spawn(listener);
                return Ok(Async::Ready(()));
            }
            Err(err) => {
                eprintln!("server failed: {}", err);
                ::std::process::exit(1);
            }
        };

    }
}