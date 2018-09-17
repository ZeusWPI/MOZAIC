use tokio;
use futures::sync::mpsc;
use std::io;

use network::connection_handler::ConnectionHandle;
use reactors::{WireEvent, RequestHandler, ReactorCore, Reactor, ReactorHandle};
use planetwars::PwMatch;
use events;
use rand::{thread_rng, Rng};
use sodiumoxide::crypto::sign::PublicKey;

use reactors::{EventBox, AnyEvent};

use super::ConnectionManager;
use super::match_handler::MatchHandler;


pub struct ControlHandler {
    handle: Option<ConnectionHandle>,
    connection_manager: ConnectionManager,
}

impl ControlHandler {
    pub fn new(handle: ConnectionHandle,
               connection_manager: ConnectionManager)
               -> Self
    {
        ControlHandler {
            handle: Some(handle),
            connection_manager,
        }
    }

    // TODO: oh please clean this up
    pub fn create_match(&mut self, e: &events::CreateMatchRequest)
        -> io::Result<WireEvent>
    {
        let (ctrl_handle, ctrl_chan) = mpsc::unbounded();
        let reactor_handle = ReactorHandle::new(ctrl_handle);

        // TODO: dont panic on invalid key
        let owner_key = PublicKey::from_slice(&e.owner_public_key).unwrap();
        let mut match_uuid = vec![0u8; 16];
        thread_rng().fill(&mut match_uuid[..]);

        let mut core = RequestHandler::new(
            MatchHandler::new(reactor_handle.clone())
        );
        core.add_handler(MatchHandler::create_client);
        core.add_handler(MatchHandler::remove_client);
        core.add_handler(MatchHandler::start_game);

        let match_owner = self.connection_manager.create_connection(
            match_uuid.clone(),
            0, // owner is always client-id 0. Is this how we want it?
            owner_key,
            |_| core
        );

        let pw_match = PwMatch::new(
            match_uuid.clone(),
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

        Ok(
            EventBox::new(events::CreateMatchResponse {
                match_uuid: match_uuid,
            }).as_wire_event()
        )
    }

    pub fn quit(&mut self, _e: &events::ConnectionClosed)
        -> io::Result<WireEvent>
    {
        println!("CONTROL CONNECItON CLOSED");
        let handle = self.handle.take().unwrap();
        self.connection_manager.unregister(handle.id());
        return Ok(WireEvent::null());
    }
}
