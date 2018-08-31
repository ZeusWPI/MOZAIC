use tokio;
use futures::sync::mpsc;

use network::connection_handler::ConnectionHandle;
use reactors::{Event, ReactorCore, Reactor, ReactorHandle};
use planetwars::PwMatch;
use events;

use reactors::{EventBox, AnyEvent};

use super::ConnectionManager;


pub struct ControlHandler {
    handle: ConnectionHandle,
    connection_manager: ConnectionManager,
}

impl ControlHandler {
    pub fn new(handle: ConnectionHandle,
               connection_manager: ConnectionManager)
               -> Self
    {
        ControlHandler {
            handle,
            connection_manager,
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

        let token = e.control_token.clone();
        let match_owner = self.connection_manager
            .create_connection(token, |_| owner_core);

        let pw_match = PwMatch::new(
            reactor_handle,
            self.connection_manager.clone(),
        );

        let mut core = ReactorCore::new(pw_match);
        core.add_handler(PwMatch::register_client);
        core.add_handler(PwMatch::remove_client);
        core.add_handler(PwMatch::start_game);
        core.add_handler(PwMatch::game_step);
        core.add_handler(PwMatch::client_message);
        core.add_handler(PwMatch::game_finished);
        core.add_handler(PwMatch::timeout);

        tokio::spawn(Reactor::new(
            core,
            match_owner,
            self.connection_manager.clone(),
            ctrl_chan,
        ));

        // TODO: eww.
        self.handle.send(
            EventBox::new(events::MatchCreated {
                match_uuid: e.match_uuid.clone(),
            }).as_wire_event()
        );
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