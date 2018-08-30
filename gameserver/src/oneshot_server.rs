use std;
use std::time::{Duration, Instant};

use futures::{Future, Poll, Async};
use std::sync::{Arc, Mutex};
use tokio;
use tokio::timer::Delay;
use utils::hex_serializer;
use futures::sync::mpsc;


use network;
use network::connection_table::ConnectionTable;
use network::connection_router::{GameServerRouter, ConnectionRouter};
use reactors::{Event, ReactorCore, Reactor, ReactorHandle};
use planetwars::PwMatch;
use events;

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

struct Forwarder {
    handle: ReactorHandle,
}

impl Forwarder {
    pub fn forward<E>(&mut self, event: &E)
        where E: Event + Clone + 'static
    {
        self.handle.dispatch(event.clone());
    }
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
        let connection_table = Arc::new(Mutex::new(ConnectionTable::new()));
        let router = Arc::new(Mutex::new(GameServerRouter::new()));
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();
        let reactor_handle = ReactorHandle::new(ctrl_handle);

        let mut owner_core = ReactorCore::new(
            Forwarder { handle: reactor_handle.clone() }
        );

        owner_core.add_handler(Forwarder::forward::<events::RegisterClient>);
        owner_core.add_handler(Forwarder::forward::<events::RemoveClient>);
        owner_core.add_handler(Forwarder::forward::<events::StartGame>);

        let connection_id = connection_table.lock()
            .unwrap()
            .create(owner_core);
        router.lock()
            .unwrap()
            .register(self.config.ctrl_token.clone(), connection_id);

        let match_owner = connection_table
            .lock()
            .unwrap()
            .get(connection_id)
            .unwrap();

        let pw_match = PwMatch::new(
            reactor_handle,
            connection_table.clone(),
        );

        let mut core = ReactorCore::new(pw_match);
        core.add_handler(PwMatch::register_client);
        core.add_handler(PwMatch::remove_client);
        core.add_handler(PwMatch::start_game);
        core.add_handler(PwMatch::game_step);
        core.add_handler(PwMatch::client_message);
        core.add_handler(PwMatch::game_finished);
        core.add_handler(PwMatch::timeout);

        let reactor = Reactor::new(core, match_owner, ctrl_chan);

        tokio::spawn(reactor.and_then(|_| {
            println!("done");
            // wait a second for graceful exit
            let end = Instant::now() + Duration::from_secs(1);
            Delay::new(end).map_err(|e| panic!("delay errored; err={:?}", e))
        }).map(|_| {
            std::process::exit(0);
        }));

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
