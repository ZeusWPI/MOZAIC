
// TODO: do we need this trait?

use std::collections::HashSet;
use planetwars::game_controller::GameController;
use planetwars::controller::PlayerId;

use serde::de::DeserializeOwned;

pub trait Lock<G: GameController<C>, C: DeserializeOwned> {
    /// Creates new Lock
    fn new (game_controller: G, awaiting_clients: HashSet<PlayerId>) -> Self;
    /// Flushes the lock, maybe returning a vector of winner ids
    fn do_step(&mut self) -> (u64, Option<Vec<PlayerId>>);

    /// Returns whether or not the lock has all msgs of the clients
    /// That he is waiting for
    fn is_ready(&self) -> bool;
    /// Push a command from a client to the lock
    fn attach_command(&mut self, client_id: PlayerId, msg: Vec<u8>);

    /// A client has connected whether it's an initial connect
    /// or a reconnect
    fn connect(&mut self, client_id: PlayerId);
    /// A client has disconnected, lock hasn't to wait for it
    /// till it connects again
    fn disconnect(&mut self, client_id: PlayerId);
    /// Lock act's, mainly used for timouts
    fn do_time_out(&mut self);

    fn get_waiting(&self) -> HashSet<PlayerId> {
        HashSet::new()
    }
}