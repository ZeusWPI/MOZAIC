
use std::collections::HashMap;
use std::collections::HashSet;

use planetwars::Config;
use planetwars::controller::Client;

use slog;

/// No connections because MOZAIC handles them disconnected
/// players aren't waited for and just deliver empty Strings
pub trait GameController {
    /// Creates new GameController, something that communicates with the game
    fn new(conf: Config, clients: Vec<Client>, logger: slog::Logger) -> Self;

    /// Tells the GameController that all players are connected
    /// Returns client_id's that are wanted for the next turn
    /// Empty HashSet implies noone is waited for, just send commands trough
    fn start(&mut self) -> HashSet<usize>;

    /// Tells the GameController that some client commands are comming
    /// Msgs can have more commands then wanted
    /// Returns client_id's that are wanted for the next turn
    /// Empty HashSet implies noone is waited for, just send commands trough
    fn step(&mut self, msgs: HashMap<usize, String>) -> HashSet<usize>;

    /// Returns the player id of the winner(s) or None if the game is still going
    fn outcome(& self) -> Option<Vec<usize>>;
}