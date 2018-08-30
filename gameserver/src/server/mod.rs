use utils::hex_serializer;

use futures::{Future, Poll, Async};
use std::sync::{Arc, Mutex};
use tokio;

use network;
use network::connection_table::ConnectionTable;
use network::connection_router::{GameServerRouter, ConnectionRouter};
use reactors::ReactorCore;


#[derive(Serialize, Deserialize)]
pub struct Config {
    #[serde(with="hex_serializer")]
    pub ctrl_token: Vec<u8>,
    pub address: String,
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

        // TODO: add some handlers
        let core = ReactorCore::new(());

        let connection_id = connection_table.lock()
            .unwrap()
            .create(core);
        router.lock()
            .unwrap()
            .register(self.config.ctrl_token.clone(), connection_id);

                let addr = self.config.address.parse().unwrap();

        let connection_router = ConnectionRouter { router, connection_table };

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