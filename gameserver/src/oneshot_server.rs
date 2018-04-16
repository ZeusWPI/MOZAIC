use std;
use std::fs::File;
use std::time::{Duration, Instant};

use futures::{Future, Poll, Async};
use futures::sync::mpsc;
use hex;
use serde::de::{Deserialize, Deserializer, DeserializeOwned};
use serde::de::Error as DeserializationError;
use slog_json;
use slog::{self, Drain};
use std::sync::{Arc, Mutex};
use tokio;
use tokio::timer::Delay;

use connection;
use connection::router::RoutingTable;
use planetwars::{PwController, Config as PwConfig};
use players::{PlayerController, Client, PlayerId};


#[serde(bound(deserialize = ""))]
#[derive(Serialize, Deserialize)]
pub struct MatchDescription<T: DeserializeOwned> {
    pub players: Vec<PlayerConfig>,
    pub log_file: String,
    pub game_config: T,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    #[serde(deserialize_with="from_hex")]
    pub token: Vec<u8>,
}

fn from_hex<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where D: Deserializer<'de>
{
    let s: &str = try!(Deserialize::deserialize(deserializer));
    return hex::decode(s).map_err(D::Error::custom);
}

/// A simple future that starts a server for just one predefined game.
/// This is a future so that it can be run on a tokio runtime, which allows
/// us to spawn additional tasks.
pub struct OneshotServer {
    config: MatchDescription<PwConfig>,
}

impl OneshotServer {
    pub fn new(config: MatchDescription<PwConfig>) -> Self {
        OneshotServer {
            config,
        }
    }
}

impl Future for OneshotServer {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        let log_file = File::create(&self.config.log_file).unwrap();

        let logger = slog::Logger::root( 
            Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
            o!()
        );

        let routing_table = Arc::new(Mutex::new(RoutingTable::new()));

        let (controller_handle, controller_chan) = mpsc::unbounded();

        let clients = self.config.players.iter().enumerate().map(|(num, desc)| {
            let num = PlayerId::new(num);
            let controller = PlayerController::new(
                num,
                desc.token.clone(),
                routing_table.clone(),
                controller_handle.clone());
            let ctrl_handle = controller.handle();

            tokio::spawn(controller);

            Client {
                id: num,
                player_name: desc.name.clone(),
                // TODO
                handle: ctrl_handle,
            }
        }).collect();

        let controller = PwController::new(
            self.config.game_config.clone(),
            clients,
            controller_chan,
            logger,
        );
        tokio::spawn(controller.and_then(|_| {
            println!("done");
            // wait a second for graceful exit
            let end = Instant::now() + Duration::from_secs(1);
            Delay::new(end).map_err(|e| panic!("delay errored; err={:?}", e))
        }).map(|_| {
            std::process::exit(0);
        }));

        let addr = "127.0.0.1:9142".parse().unwrap();
        let listener = connection::tcp::Listener::new(&addr, routing_table.clone()).unwrap();
        tokio::spawn(listener);

        return Ok(Async::Ready(()));
    }
}
