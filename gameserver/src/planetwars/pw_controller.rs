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
        let offset = state.players.len() - self.id.as_usize();
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
            ClientId(0),
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
        return ClientId(num);
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
                let ClientId(client_num) = self.add_player(request.token);
                let response = lobby_message::AddPlayerResponse {
                    client_id: client_num,
                };
                self.ctrl_handle.respond(message_id, encode_message(&response));
            }
            Some(lobby_message::Payload::RemovePlayer(request)) => {
                self.remove_player(ClientId(request.client_id));
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
                    let ClientId(client_num) = event.client_id;
                    let msg = proto::ControlMessage::PlayerConnected {
                        player_id: client_num as u64
                    };
                    let serialized = serde_json::to_vec(&msg).unwrap();
                    self.ctrl_handle.send(serialized);
                }
            },
            EventContent::Disconnected => {
                if self.players.contains_key(&event.client_id) {
                    let ClientId(client_num) = event.client_id;
                    let msg = proto::ControlMessage::PlayerDisconnected {
                        player_id: client_num as u64
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

    client_player: HashMap<ClientId, PlayerId>,
    players: HashMap<PlayerId, Player>,

    waiting_for: HashSet<PlayerId>,
    commands: HashMap<PlayerId, ResponseValue>,
}

impl PwController {
    pub fn new(lobby: Lobby) -> Self {
        // TODO: neat error handling
        let raw_conf = lobby.game_data.as_ref()
            .expect("game data not present in lobby");
        let conf: Config = serde_json::from_slice(raw_conf)
            .expect("could not parse game data");
        let state = conf.create_game(lobby.players.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut client_player = HashMap::new();
        let mut players = HashMap::new();

        let iter = lobby.players.into_iter().enumerate();
        for (player_num, (client_id, client_handle)) in iter {
            let player_id = PlayerId::new(player_num);
            client_player.insert(client_id, player_id);
            players.insert(player_id, Player {
                id: player_id,
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
    fn step(&mut self, messages: HashMap<PlayerId, ResponseValue>) {
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

        // these borrows are required so that the retain closure
        // does not have to borrow self (which would create a lifetime conflict)
        let state = &self.state;
        let waiting_for = &mut self.waiting_for;

        self.players.retain(|player_id, player| {
            if state.players[player_id.as_usize()].alive {
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
            self.players.get_mut(&player_id).unwrap()
                .send_action(player_action);
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
                let &player_id = self.client_player
                    .get(&event.client_id).unwrap();
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