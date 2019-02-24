pub mod control_handler;
pub mod router;
pub mod connection_manager;
pub mod match_handler;

pub use self::router::{GameServerRouter, ClientId};
pub use self::connection_manager::ConnectionManager;

use utils::hex_serializer;

use futures::{Future, Poll, Async};
use tokio;

use network;
use network::server::RoutingTable;
use sodiumoxide::crypto::sign::{SecretKey, PublicKey};


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
        let control_pubkey = PublicKey::from_slice(&self.config.public_key)
            .expect("invalid public key");
        let secret_key = SecretKey::from_slice(&self.config.private_key)
            .expect("invalid secret key");

        let router = GameServerRouter::new(
            control_pubkey
        );

        let addr = self.config.address.parse().unwrap();
        let routing_table = RoutingTable::new(router, secret_key);

        match network::server::tcp::Listener::new(&addr, routing_table) {
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