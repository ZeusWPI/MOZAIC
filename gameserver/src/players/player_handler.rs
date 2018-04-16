use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use connection::connection::Request;
use connection::router::RoutingTable;
use futures::{Poll, Async, Stream};
use futures::sync::mpsc::{self, UnboundedReceiver, UnboundedSender};
use tokio;

use super::{PlayerId, PlayerMessage, PlayerCommand, PlayerController};

/// The PlayerHandler is the key part in communicating with players. It
/// manages a PlayerController for each player it handles, aggregating the
/// events they produce into one event stream, which can be accessed by
/// using `poll_message`.
pub struct PlayerHandler {
    /// Handle to the player message channel.
    handle: UnboundedSender<PlayerMessage>,

    /// Receiver for the player message channel.
    player_messages: UnboundedReceiver<PlayerMessage>,

    /// Handles to all registered players.
    player_handles: HashMap<PlayerId, UnboundedSender<PlayerCommand>>,

    /// Handle to the routing table
    routing_table: Arc<Mutex<RoutingTable>>,
}

impl PlayerHandler {
    pub fn new(routing_table: Arc<Mutex<RoutingTable>>) -> Self {
        let (handle, player_messages) = mpsc::unbounded();
        return PlayerHandler {
            player_messages,
            handle,
            routing_table,
            player_handles: HashMap::new(),
        };
    }

    /// Create a handler for given player id and identification token.
    // TODO: We probably want to generate player ids ourselves so that the
    // handler is in charge of the ids.
    pub fn add_player(&mut self, player_id: PlayerId, token: Vec<u8>) {
        let player_controller = PlayerController::new(
            player_id,
            token,
            self.routing_table.clone(),
            self.handle.clone(),
        );
        self.player_handles.insert(player_id, player_controller.handle());
        tokio::spawn(player_controller);
    }

    /// Dispatch a request to a player.
    pub fn request(&mut self, player_id: PlayerId, request: Request) {
        let handle = match self.player_handles.get_mut(&player_id) {
            None => panic!("invalid PlayerId"),
            Some(handle) => handle,
        };
        handle.unbounded_send(PlayerCommand::Request(request)).unwrap();
    }

    /// Poll for a PlayerMessage.
    pub fn poll_message(&mut self) -> Poll<PlayerMessage, ()> {
        match self.player_messages.poll() {
            Ok(Async::Ready(Some(message))) => Ok(Async::Ready(message)),
            // Unbounded channels only stop when all senders are dropped.
            // We own a sender, so this should never happen.
            Ok(Async::Ready(None)) => panic!("something terribly bad happened"),
            Ok(Async::NotReady) => Ok(Async::NotReady),
            // Unbounded channels should not error.
            Err(err) => panic!("channel error: {:?}", err),
        }
    }
}