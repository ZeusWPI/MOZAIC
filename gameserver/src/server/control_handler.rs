use std::sync::{Arc, Mutex};

use tokio;
use futures::sync::mpsc;

use network::connection_handler::ConnectionHandle;
use network::connection_table::ConnectionTable;
use network::connection_router::GameServerRouter;
use reactors::{Event, ReactorCore, Reactor, ReactorHandle};
use planetwars::PwMatch;
use events;


pub struct ControlHandler {
    handle: ConnectionHandle,
    connection_table: Arc<Mutex<ConnectionTable>>,
    router: Arc<Mutex<GameServerRouter>>,
}

impl ControlHandler {
    pub fn new(handle: ConnectionHandle,
               connection_table: Arc<Mutex<ConnectionTable>>,
               router: Arc<Mutex<GameServerRouter>>)
               -> Self
    {
        ControlHandler {
            handle,
            connection_table,
            router,
        }
    }

    // TODO: oh please clean this up
    pub fn create_match(&mut self, e: &events::CreateMatch) {
                let (ctrl_handle, ctrl_chan) = mpsc::unbounded();
        let reactor_handle = ReactorHandle::new(ctrl_handle);

        let mut owner_core = ReactorCore::new(
            Forwarder { handle: reactor_handle.clone() }
        );

        owner_core.add_handler(Forwarder::forward::<events::RegisterClient>);
        owner_core.add_handler(Forwarder::forward::<events::RemoveClient>);
        owner_core.add_handler(Forwarder::forward::<events::StartGame>);

        let connection_id = self.connection_table.lock()
            .unwrap()
            .create(|_| owner_core);
        self.router.lock()
            .unwrap()
            .register(e.control_token.clone(), connection_id);

        let match_owner = self.connection_table
            .lock()
            .unwrap()
            .get(connection_id)
            .unwrap();

        let pw_match = PwMatch::new(
            reactor_handle,
            self.connection_table.clone(),
            self.router.clone(),
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
        tokio::spawn(reactor);
    }
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