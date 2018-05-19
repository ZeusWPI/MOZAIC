use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use std::mem;

use tokio;
use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{self, UnboundedSender, UnboundedReceiver};

use utils::request_handler::{
    ConnectionId,
    Event,
    EventContent,
    ConnectionHandle,
    ConnectionHandler,
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
    connection: ConnectionHandle,
}

pub struct PwMatch {
    state: PwMatchState,
    event_channel_handle: UnboundedSender<Event>,
    event_channel: UnboundedReceiver<Event>,
}

enum PwMatchState {
    Lobby(Lobby),
    Playing(PwController),
    Finished,
}

impl PwMatch {
    pub fn new(conf: Config,
               ctrl_token: Vec<u8>,
               client_tokens: Vec<Vec<u8>>,
               routing_table: Arc<Mutex<RoutingTable>>,
               logger: slog::Logger)
               -> Self
    {
        let (snd, rcv) = mpsc::unbounded();

        let lobby = Lobby::new(
            conf,
            ctrl_token,
            client_tokens,
            routing_table,
            snd.clone(),
            logger
        );

        return PwMatch {
            state: PwMatchState::Lobby(lobby),
            event_channel_handle: snd,
            event_channel: rcv,
        }
    }

    fn take_state(&mut self) -> PwMatchState {
        mem::replace(&mut self.state, PwMatchState::Finished)
    }
}

impl Future for PwMatch {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            let event = try_ready!(self.event_channel.poll())
                .expect("event channel closed");

            
            match self.take_state() {
                PwMatchState::Lobby(mut lobby) => {
                    lobby.handle_event(event);
                    
                    if lobby.waiting {
                        self.state = PwMatchState::Lobby(lobby);
                    } else {
                        let pw_controller = PwController::new(lobby);
                        self.state = PwMatchState::Playing(pw_controller);
                    }
                }

                PwMatchState::Playing(mut pw_controller) => {
                    pw_controller.handle_event(event);

                    if pw_controller.state.is_finished() {
                        self.state = PwMatchState::Finished;
                        // TODO: how do we properly handle this?
                        return Ok(Async::Ready(()));
                    } else {
                        self.state = PwMatchState::Playing(pw_controller);
                    }
                }

                PwMatchState::Finished => {}
            }
        }
    }
}

pub struct Lobby {
    conf: Config,
    logger: slog::Logger,
    ctrl_handle: ConnectionHandle,

    // whether we should stay in the waiting state
    waiting: bool,
    connection_player: HashMap<ConnectionId, PlayerId>,
    players: HashMap<PlayerId, Player>,
}

impl Lobby {
    fn new(conf: Config,
           ctrl_token: Vec<u8>,
           client_tokens: Vec<Vec<u8>>,
           routing_table: Arc<Mutex<RoutingTable>>,
           event_channel_handle: UnboundedSender<Event>,
           logger: slog::Logger)
           -> Self
    {
        let (ctrl_handle, handler) = ConnectionHandler::new(
            ConnectionId { connection_num: 0 },
            ctrl_token,
            routing_table.clone(),
            event_channel_handle.clone(),
        );
        tokio::spawn(handler);

        let mut players = HashMap::new();
        let mut connection_player = HashMap::new();
        let mut waiting_for = HashSet::new();

        for (num, token) in client_tokens.into_iter().enumerate() {
            let player_id = PlayerId::new(num);
            let connection_id = ConnectionId { connection_num: num+1 };

            let (handle, handler) = ConnectionHandler::new(
                connection_id,
                token,
                routing_table.clone(),
                event_channel_handle.clone(),
            );

            let player = Player {
                id: player_id,
                connection: handle,
            };

            tokio::spawn(handler);

            players.insert(player_id, player);
            connection_player.insert(connection_id, player_id);
            waiting_for.insert(player_id);
        }

        return Lobby {
            conf,
            logger,
            ctrl_handle,
            waiting: true,
            connection_player,
            players,
        }
    }

    fn handle_event(&mut self, event: Event) {
        match event.content {
            EventContent::Connected => {
                let val = self.connection_player.get(&event.connection_id);
                if let Some(&player_id) = val {
                    let msg = proto::ControlMessage::PlayerConnected {
                        player_id: (player_id.as_usize() + 1) as u64
                    };
                    let serialized = serde_json::to_vec(&msg).unwrap();
                    self.ctrl_handle.send(serialized);
                }
            },
            EventContent::Disconnected => {
                let val = self.connection_player.get(&event.connection_id);
                if let Some(&player_id) = val {
                    let msg = proto::ControlMessage::PlayerDisconnected {
                        player_id: (player_id.as_usize() + 1) as u64
                    };
                    let serialized = serde_json::to_vec(&msg).unwrap();
                    self.ctrl_handle.send(serialized);
                }
            },
            EventContent::Message { data, .. } => {
                let cmd = serde_json::from_slice(&data).unwrap();

                match cmd {
                    proto::LobbyCommand::StartMatch => {
                        self.waiting = false;
                    }
                }
            },
            EventContent::Response { .. } => {},
        }
    }
}

pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: slog::Logger,
    ctrl_handle: ConnectionHandle,

    connection_player: HashMap<ConnectionId, PlayerId>,
    players: HashMap<PlayerId, Player>,

    waiting_for: HashSet<PlayerId>,
    commands: HashMap<PlayerId, ResponseValue>,
}

impl PwController {
    pub fn new(lobby: Lobby) -> Self {
        let state = lobby.conf.create_game(lobby.players.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut controller = PwController {
            state,
            planet_map,
            players: lobby.players,
            connection_player: lobby.connection_player,
            logger: lobby.logger,
            ctrl_handle: lobby.ctrl_handle,

            waiting_for: HashSet::new(),
            commands: HashMap::new(),
        };
        controller.start_game();
        return controller;
    }


    fn start_game(&mut self) {
        self.log_state();
        self.prompt_players();
    }

    /// Advance the game by one turn.
    fn step(&mut self, messages: HashMap<PlayerId, ResponseValue>) {
        self.state.repopulate();
        self.execute_messages(messages);
        self.state.step();

        self.log_state();

        if !self.state.is_finished() {
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

    fn log_state(&mut self) {
        // TODO: add turn number
        info!(self.logger, "step"; serialize(&self.state));
        let serialized_state = serialize(&self.state);
        let message = proto::ControlMessage::GameState(serialized_state);
        let serialized = serde_json::to_vec(&message).unwrap();
        self.ctrl_handle.send(serialized);
    }

    fn prompt_players(&mut self) {
        let deadline = Instant::now() + Duration::from_secs(1);

        for player in self.state.players.iter() {
            if player.alive {
                let offset = self.state.players.len() - player.id.as_usize();

                let serialized_state = serialize_rotated(&self.state, offset);
                let message = proto::ServerMessage::GameState(serialized_state);
                let serialized = serde_json::to_vec(&message).unwrap();

                self.waiting_for.insert(player.id);
                self.players.get_mut(&player.id).unwrap().connection
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
            self.players.get_mut(&player_id).unwrap().connection.
                send(serialized);
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

    fn handle_event(&mut self, event: Event) {
        match event.content {
            EventContent::Connected => {},
            EventContent::Disconnected => {},
            EventContent::Message { .. } => {},
            EventContent::Response { value, .. } => {
                // we only send requests to players
                let &player_id = self.connection_player
                    .get(&event.connection_id).unwrap();
                self.commands.insert(player_id, value);
                self.waiting_for.remove(&player_id);
            }
        }

        if self.waiting_for.is_empty() {
            let commands = mem::replace(&mut self.commands, HashMap::new());
            self.step(commands);
        }
    }
}