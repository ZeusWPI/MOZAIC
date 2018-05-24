use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use std::mem;

use tokio;
use futures::{Future, Poll, Async, Stream};
use futures::sync::mpsc::{self, UnboundedSender, UnboundedReceiver};
use prost::Message as ProtobufMessage;
use protocol::LobbyMessage;
use protocol::lobby_message;

use utils::client_handler::{
    MessageId,
    Event,
    EventContent,
    ClientHandle,
    ClientHandler,
    ResponseValue,
    ResponseError,
};
use network::router::{RoutingTable, ClientId};

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

pub struct Player {
    id: ClientId,
    num: usize,
    handle: ClientHandle,
}

impl Player {
    fn prompt(&mut self, state: &PlanetWars, deadline: Instant) {
        let s = self.serialized_state(state);
        self.request(proto::ServerMessage::GameState(s), deadline);

    }

    fn send_final_state(&mut self, state: &PlanetWars) {
        let s = self.serialized_state(state);
        self.send(proto::ServerMessage::FinalState(s));
    }

    fn send_action(&mut self, action: PlayerAction) {
        self.send(proto::ServerMessage::PlayerAction(action));
    }

    fn serialized_state(&self, state: &PlanetWars) -> proto::State {
        let offset = state.players.len() - self.num;
        return serialize_rotated(state, offset);
    }

    fn request(&mut self, msg: proto::ServerMessage, deadline: Instant) {
        let data = serde_json::to_vec(&msg).unwrap();
        self.handle.request(data, deadline);
    }

    fn send(&mut self, msg: proto::ServerMessage) {
        let data = serde_json::to_vec(&msg).unwrap();
        self.handle.send(data);
    }

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
    pub fn new(ctrl_token: Vec<u8>,
               routing_table: Arc<Mutex<RoutingTable>>,
               logger: slog::Logger)
               -> Self
    {
        let (snd, rcv) = mpsc::unbounded();

        let lobby = Lobby::new(
            ctrl_token,
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
                    
                    if lobby.game_data.is_some() {
                        let pw_controller = PwController::new(lobby);
                        self.state = PwMatchState::Playing(pw_controller);
                    } else {
                        self.state = PwMatchState::Lobby(lobby);
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
    logger: slog::Logger,
    ctrl_handle: ClientHandle,

    routing_table: Arc<Mutex<RoutingTable>>,
    event_channel_handle: UnboundedSender<Event>,

    game_data: Option<Vec<u8>>,
    players: HashMap<ClientId, ClientHandle>,
    client_counter: u64,
}

impl Lobby {
    fn new(ctrl_token: Vec<u8>,
           routing_table: Arc<Mutex<RoutingTable>>,
           event_channel_handle: UnboundedSender<Event>,
           logger: slog::Logger)
           -> Self
    {
        // open control connection
        let (ctrl_handle, handler) = ClientHandler::new(
            ClientId::new(0),
            ctrl_token,
            routing_table.clone(),
            event_channel_handle.clone(),
        );
        tokio::spawn(handler);

        return Lobby {
            logger,
            ctrl_handle,

            routing_table,
            event_channel_handle,

            game_data: None,
            players: HashMap::new(),
            // start counter at 1, because 0 is the control client
            client_counter: 1,
        }
    }

    fn generate_client_id(&mut self) -> ClientId {
        let num = self.client_counter;
        self.client_counter += 1;
        return ClientId::new(num);
    }

    fn add_player(&mut self, connection_token: Vec<u8>) -> ClientId {
        let client_id = self.generate_client_id();
        let (handle, handler) = ClientHandler::new(
            client_id,
            connection_token,
            self.routing_table.clone(),
            self.event_channel_handle.clone(),
        );
        self.players.insert(client_id, handle);
        tokio::spawn(handler);
        return client_id;
    }

    fn remove_player(&mut self, client_id: ClientId) {
        self.players.remove(&client_id);
    }

    fn handle_message(&mut self, message_id: MessageId, content: Vec<u8>) {
        let message = match LobbyMessage::decode(content) {
            Err(_) => { return; }, // skip
            Ok(message) => message
        };
        match message.payload {
            None => { } // skip
            Some(lobby_message::Payload::AddPlayer(request)) => {
                let client_id = self.add_player(request.token);
                let response = lobby_message::AddPlayerResponse {
                    client_id: client_id.as_u64(),
                };
                self.ctrl_handle.respond(message_id, encode_message(&response));
            }
            Some(lobby_message::Payload::RemovePlayer(request)) => {
                self.remove_player(ClientId::new(request.client_id));
                let response = lobby_message::RemovePlayerResponse {};
                self.ctrl_handle.respond(message_id, encode_message(&response));
            }
            Some(lobby_message::Payload::StartGame(request)) => {
                self.game_data = Some(request.payload);
                let response = lobby_message::StartGameResponse {};
                self.ctrl_handle.respond(message_id, encode_message(&response));
            }
        }
    }

    fn handle_event(&mut self, event: Event) {
        match event.content {
            EventContent::Connected => {
                if self.players.contains_key(&event.client_id) {
                    let msg = proto::ControlMessage::PlayerConnected {
                        player_id: event.client_id.as_u64(),
                    };
                    let serialized = serde_json::to_vec(&msg).unwrap();
                    self.ctrl_handle.send(serialized);
                }
            },
            EventContent::Disconnected => {
                if self.players.contains_key(&event.client_id) {
                    let msg = proto::ControlMessage::PlayerDisconnected {
                        player_id: event.client_id.as_u64(),
                    };
                    let serialized = serde_json::to_vec(&msg).unwrap();
                    self.ctrl_handle.send(serialized);
                }
            },
            EventContent::Message { message_id, data } => {
                if event.client_id == self.ctrl_handle.id() {
                    self.handle_message(message_id, data);
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
    ctrl_handle: ClientHandle,

    client_player: HashMap<ClientId, usize>,
    players: HashMap<ClientId, Player>,

    waiting_for: HashSet<ClientId>,
    commands: HashMap<ClientId, ResponseValue>,
}

impl PwController {
    pub fn new(lobby: Lobby) -> Self {
        // TODO: neat error handling
        let raw_conf = lobby.game_data.as_ref()
            .expect("game data not present in lobby");
        let conf: Config = serde_json::from_slice(raw_conf)
            .expect("could not parse game data");

        // TODO: we probably want a way to fixate player order
        let client_ids = lobby.players.keys().cloned().collect();
        let state = conf.create_game(client_ids);

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut client_player = HashMap::new();
        let mut players = HashMap::new();

        let iter = lobby.players.into_iter().enumerate();
        for (player_num, (client_id, client_handle)) in iter {
            client_player.insert(client_id, player_num);
            players.insert(client_id, Player {
                id: client_id,
                num: player_num,
                handle: client_handle,
            });
        }

        let mut controller = PwController {
            state,
            planet_map,
            players,
            client_player,
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
    fn step(&mut self, messages: HashMap<ClientId, ResponseValue>) {
        self.state.repopulate();
        self.execute_messages(messages);
        self.state.step();

        self.log_state();

        if self.state.is_finished() {
            self.finish_game();
        } else {
            self.prompt_players();
        }
    }

    fn outcome(&self) -> Option<Vec<ClientId>> {
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

        // these borrows are required so that the retain closure
        // does not have to borrow self (which would create a lifetime conflict)
        let state = &self.state;
        let waiting_for = &mut self.waiting_for;

        self.players.retain(|_, player| {
            if state.players[player.num].alive {
                waiting_for.insert(player.id);
                player.prompt(state, deadline);
                // keep this player in the game
                return true;
            } else {
                player.send_final_state(state);
                // this player is dead, kick him!
                return false;
            }
        });
    }

    // TODO: ewwwww dup
    fn finish_game(&mut self) {
        let state = &self.state;

        self.players.retain(|_player_id, player| {
            player.send_final_state(state);
            // the game is over, we are kicking everyone.
            return false;
        });
    }

    fn execute_messages(&mut self, mut msgs: HashMap<ClientId, ResponseValue>) {
        for (client_id, result) in msgs.drain() {
            let player_num = self.players[&client_id].num;
            let player_action = self.execute_action(player_num, result);
            self.players.get_mut(&client_id).unwrap()
                .send_action(player_action);
        }
    }

    fn execute_action(&mut self, player_num: usize, response: ResponseValue)
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
            match self.parse_command(player_num, &command) {
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

    fn parse_command(&self, player_num: usize, mv: &proto::Command)
                     -> Result<Dispatch, CommandError>
    {
        let origin_id = *self.planet_map
            .get(&mv.origin)
            .ok_or(CommandError::OriginDoesNotExist)?;

        let target_id = *self.planet_map
            .get(&mv.destination)
            .ok_or(CommandError::DestinationDoesNotExist)?;

        if self.state.planets[origin_id].owner() != Some(player_num) {
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
                // we only send requests to players, so we do not have to check
                // whether the responder is a player
                self.commands.insert(event.client_id, value);
                self.waiting_for.remove(&event.client_id);
            }
        }

        if self.waiting_for.is_empty() {
            let commands = mem::replace(&mut self.commands, HashMap::new());
            self.step(commands);
        }
    }
}

/// encode a protobuf message
// TODO: this is a general util, maybe put it somewhere nice.
fn encode_message<M>(message: &M) -> Vec<u8>
    where M: ProtobufMessage
{
    let mut bytes = Vec::with_capacity(message.encoded_len());
    // encoding can only fail because the buffer does not have
    // enough space allocated, but we just allocated the required
    // space.
    message.encode(&mut bytes).unwrap();
    return bytes;
}