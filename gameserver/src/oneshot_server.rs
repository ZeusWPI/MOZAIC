use std;
use std::time::{Duration, Instant};

use futures::{Future, Poll, Async};
use std::sync::{Arc, Mutex};
use tokio;
use tokio::timer::Delay;
use utils::hex_serializer;
use futures::sync::mpsc;


use network;
use network::connection::Connection;
use network::router::{RoutingTable, ClientId};
use reactors::{ReactorCore, MasterReactor, MasterReactorHandle};
use planetwars::PwMatch;

#[derive(Serialize, Deserialize)]
pub struct MatchDescription {
    #[serde(with="hex_serializer")]
    pub ctrl_token: Vec<u8>,
    pub address: String,
    pub log_file: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlayerConfig {
    pub name: String,
    #[serde(with="hex_serializer")]
    pub token: Vec<u8>,
}

/// A simple future that starts a server for just one predefined game.
/// This is a future so that it can be run on a tokio runtime, which allows
/// us to spawn additional tasks.
pub struct OneshotServer {
    config: MatchDescription,
}

impl OneshotServer {
    pub fn new(config: MatchDescription) -> Self {
        OneshotServer {
            config,
        }
    }
}

impl Future for OneshotServer {
    type Item = ();
    type Error = ();

    // This is some rather temporary code, don't mind its dirty intrinsics
    // too much. We don't want oneshot servers, we want a gameserver that can
    // run multiple games in parallel.
    fn poll(&mut self) -> Poll<(), ()> {
        let routing_table = Arc::new(Mutex::new(RoutingTable::new()));

        let connection = Connection::new(
            self.config.ctrl_token.clone(),
            // TODO: heh, maybe we want an actual client id here.
            ClientId::new(0),
            routing_table.clone(),
        );

        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();


        let pw_match = PwMatch::new(
            MasterReactorHandle::new(ctrl_handle),
            routing_table.clone()
        );

        let mut core = ReactorCore::new(pw_match);
        core.add_handler(PwMatch::register_client);
        core.add_handler(PwMatch::remove_client);
        core.add_handler(PwMatch::start_game);
        core.add_handler(PwMatch::game_step);
        core.add_handler(PwMatch::client_message);
        core.add_handler(PwMatch::game_finished);
        core.add_handler(PwMatch::timeout);
        let reactor = MasterReactor::new(core, ctrl_chan, connection);

        tokio::spawn(reactor.and_then(|_| {
            println!("done");
            // wait a second for graceful exit
            let end = Instant::now() + Duration::from_secs(1);
            Delay::new(end).map_err(|e| panic!("delay errored; err={:?}", e))
        }).map(|_| {
            std::process::exit(0);
        }));

        let addr = self.config.address.parse().unwrap();
        match network::tcp::Listener::new(&addr, routing_table.clone()) {
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
