use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};

use tokio;
use futures::{Future, Poll, Async};
use futures::sync::mpsc::{self, UnboundedSender, UnboundedReceiver};

//use utils::{PlayerLock, ResponseValue, ResponseError};
use utils::request_handler::{
    ConnectionId,
    Event,
    ConnectionHandler,
    Command as ConnectionCommand,
    ResponseValue,
    ResponseError,
};
use network::router::RoutingTable;

use super::Config;
use super::pw_rules::{PlanetWars, Dispatch};
use super::pw_serializer::{serialize, serialize_rotated};
use super::pw_protocol::{
    self as proto,
    PlayerAction,
    PlayerCommand, 
    CommandError,
    Command,
};

use slog;
use serde_json;

// TODO: find a better place for this
#[derive(PartialEq, Clone, Copy, Eq, Hash, Serialize, Deserialize, Debug)]
pub struct PlayerId {
    id: usize,
}

impl PlayerId {
    pub fn new(id: usize) -> PlayerId {
        PlayerId {
            id
        }
    }

    pub fn as_usize(&self) -> usize {
        self.id
    }
}

impl slog::KV for PlayerId {
    fn serialize(&self,
                 _record: &slog::Record,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_usize("player_id", self.as_usize())
    }
}

pub struct Player {
    id: PlayerId,
    connection_id: ConnectionId,
    connection_handle: UnboundedSender<ConnectionCommand<PlayerId>>,
}

impl Player {
    fn send(&mut self, data: Vec<u8>) {
        let cmd = ConnectionCommand::Message { data };
        self.connection_handle.unbounded_send(cmd)
            .expect("connection handle broke");
    }

    fn request(&mut self, msg: Vec<u8>, deadline: Instant) {
        let cmd = ConnectionCommand::Request {
            deadline,
            message: msg,
            request_data: self.id,
        };
        self.connection_handle.unbounded_send(cmd)
            .expect("connection handle broke");
    }
}

pub struct PwController {
    game_state: GameState,
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: slog::Logger,
    players: HashMap<PlayerId, Player>,

    event_channel: UnboundedReceiver<Event<PlayerId>>,
    routing_table: Arc<Mutex<RoutingTable>>,
}


enum GameState {
    /// Waiting for players to connect
    Connecting,
    /// Game is in progress
    Playing,
    /// Game has terminated
    Finished,
}

impl PwController {
    pub fn new(conf: Config,
               client_tokens: Vec<Vec<u8>>,
               routing_table: Arc<Mutex<RoutingTable>>,
               logger: slog::Logger)
               -> Self
    {
        let (snd, rcv) = mpsc::unbounded();

        let state = conf.create_game(client_tokens.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut players = HashMap::new();

        for (num, token) in client_tokens.into_iter().enumerate() {
            let player_id = PlayerId::new(num);
            let connection_id = ConnectionId { connection_num: num };

            let connection_handler = ConnectionHandler::new(
                connection_id,
                token,
                routing_table.clone(),
                snd.clone(),
            );

            let player = Player {
                id: player_id,
                connection_id,
                connection_handle: connection_handler.handle(),
            };

            tokio::spawn(connection_handler);

            players.insert(player_id, player);
        }

        return PwController {
            routing_table,
            game_state: GameState::Connecting,
            event_channel: rcv,
            state,
            planet_map,
            players,
            logger,
        };
    }

    /// Check whether all players have succesfully connected.
    fn connect(&mut self, messages: HashMap<PlayerId, ResponseValue>) {
        // TODO: proper logging
        for (player_id, response) in messages.into_iter() {
            match response {
                Ok(_) => {},
                Err(_) =>  {
                    println!("player {} failed to connect", player_id.as_usize());
                    self.game_state = GameState::Finished;
                    return;
                },
            }
        }
        // All players have connected; we can start the game.
        self.start_game();
    }

    fn start_game(&mut self) {
        self.game_state = GameState::Playing;
        self.log_state();
        self.prompt_players();
    }

    /// Advance the game by one turn.
    fn step(&mut self, messages: HashMap<PlayerId, ResponseValue>) {
        self.state.repopulate();
        self.execute_messages(messages);
        self.state.step();

        self.log_state();

        if self.state.is_finished() {
            self.game_state = GameState::Finished;
        } else {
            self.prompt_players();
        }
    }

    fn outcome(&self) -> Option<Vec<PlayerId>> {
        if self.state.is_finished() {
            Some(self.state.living_players())
        } else {
            None
        }
    }

    fn log_state(&self) {
        // TODO: add turn number
        info!(self.logger, "step"; serialize(&self.state));
    }

    fn prompt_players(&mut self) {
        let deadline = Instant::now() + Duration::from_secs(1);
        for player in self.state.players.iter() {
            if player.alive {
                let offset = self.state.players.len() - player.id.as_usize();

                let serialized_state = serialize_rotated(&self.state, offset);
                let message = proto::ServerMessage::GameState(serialized_state);
                let serialized = serde_json::to_vec(&message).unwrap();
                self.players.get_mut(&player.id).unwrap()
                    .request(serialized, deadline);
            }
        }
    }

    fn execute_messages(&mut self, mut msgs: HashMap<PlayerId, ResponseValue>) {
        for (player_id, result) in msgs.drain() {
            // log received message
            // TODO: this should probably happen in the lock, so that
            //       we have a correct timestamp.
            match &result {
                &Ok(ref message) => {
                    let content = match String::from_utf8(message.clone()) {
                        Ok(content) => content,
                        Err(_err) => "invalid utf-8".to_string(),
                    };
                    info!(self.logger, "message received";
                        player_id,
                        "content" => content,
                    );
                },
                &Err(ResponseError::Timeout) => {
                    info!(self.logger, "timeout"; player_id);
                }
            }

            let player_action = self.execute_action(player_id, result);
            let message = proto::ServerMessage::PlayerAction(player_action);
            let serialized = serde_json::to_vec(&message).unwrap();
            self.players.get_mut(&player_id).unwrap().send(serialized);
        }
    }

    fn execute_action(&mut self, player_id: PlayerId, response: ResponseValue)
        -> PlayerAction
    {
        // TODO: it would be cool if this could be done with error_chain.

        let message = match response {
            Err(ResponseError::Timeout) => return PlayerAction::Timeout,
            Ok(message) => message,
        };

        let action: proto::Action = match serde_json::from_slice(&message) {
            Err(err) => return PlayerAction::ParseError(err.to_string()),
            Ok(action) => action,
        };

        let commands = action.commands.into_iter().map(|command| {
            match self.parse_command(player_id, &command) {
                Ok(dispatch) => {
                    self.state.dispatch(&dispatch);
                    PlayerCommand {
                        command,
                        error: None,
                    }
                },
                Err(error) => {
                    PlayerCommand {
                        command,
                        error: Some(error),
                    }
                }
            }
        }).collect();

        return PlayerAction::Commands(commands);
    }

    fn parse_command(&self, player_id: PlayerId, mv: &proto::Command)
                     -> Result<Dispatch, CommandError>
    {
        let origin_id = *self.planet_map
            .get(&mv.origin)
            .ok_or(CommandError::OriginDoesNotExist)?;

        let target_id = *self.planet_map
            .get(&mv.destination)
            .ok_or(CommandError::DestinationDoesNotExist)?;

        if self.state.planets[origin_id].owner() != Some(player_id) {
            return Err(CommandError::OriginNotOwned);
        }

        if self.state.planets[origin_id].ship_count() < mv.ship_count {
            return Err(CommandError::NotEnoughShips);
        }

        if mv.ship_count == 0 {
            return Err(CommandError::ZeroShipMove);
        }

        Ok(Dispatch {
            origin: origin_id,
            target: target_id,
            ship_count: mv.ship_count,
        })
    }
}

impl Future for PwController {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            if self.state.is_finished() {
                return Ok(Async::Ready(()));
            }
            // TODO
        }
    }
}