use std::collections::HashMap;

use connection::connection::Request;
use futures::{Poll, Async, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};

use super::{PlayerId, PlayerMessage, PlayerCommand};

/// The PlayerHandler is the key part in communicating with players. It
/// manages a PlayerController for each player it handles, aggregating the
/// events they produce into one event stream, which can be accessed by
/// using `poll_message`.
pub struct PlayerHandler {
    /// Handle to the player message channel.
    // TODO: actually keep this
    // handle: UnboundedSender<PlayerMessage>,

    /// Receiver for the player message channel.
    player_messages: UnboundedReceiver<PlayerMessage>,

    /// Handles to all registered players.
    player_handles: HashMap<PlayerId, UnboundedSender<PlayerCommand>>,
}

impl PlayerHandler {
    // TODO: for now we'll pass in the connected players, but the PlayerHandler
    // is supposed to create the PlayerControllers. This way, it can be entirely
    // in charge of its message channel, and the PlayerControllers would be its
    // 'slaves'.
    pub fn new(players: HashMap<PlayerId, UnboundedSender<PlayerCommand>>,
               player_messages: UnboundedReceiver<PlayerMessage>
               ) -> Self
    {
        PlayerHandler {
            player_handles: players,
            player_messages,
        }
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