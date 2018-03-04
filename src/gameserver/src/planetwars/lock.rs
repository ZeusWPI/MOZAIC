
use std::collections::HashSet;
use planetwars::game_controller::GameController;

use serde::de::DeserializeOwned;

pub trait Lock<G: GameController<C>, C: DeserializeOwned> {
    /// Creates new Lock
    fn new (game_controller: G, awaiting_clients: HashSet<usize>) -> Self;
    /// Flushes the lock, maybe returning a vector of winner ids
    fn do_step(&mut self) -> (u64, Option<Vec<usize>>);

    /// Returns whether or not the lock has all msgs of the clients
    /// That he is waiting for
    fn is_ready(&self) -> bool;
    /// Push a command from a client to the lock
    fn attach_command(&mut self, client_id: usize, msg: String);

    /// A client has connected whether it's an initial connect
    /// or a reconnect
    fn connect(&mut self, client_id: usize);
    /// A client has disconnected, lock hasn't to wait for it
    /// till it connects again
    fn disconnect(&mut self, client_id: usize);
    /// Lock act's, mainly used for timouts
    fn do_time_out(&mut self) -> (u64, Option<Vec<usize>>);
}