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
use reactors::reactor::Reactor;
use reactors::core_reactor::{CoreReactor, CoreReactorHandle};
use reactors::client_reactor::{ClientReactor, ClientReactorHandle};

use events;
use network::router::{RoutingTable, ClientId};
use network::connection::Connection;

use super::Config;
use super::pw_rules::{PlanetWars, Dispatch};
use super::pw_serializer::serialize_state;
use super::pw_protocol::{
    self as proto,
    PlayerAction,
    PlayerCommand, 
    CommandError,
};

use slog;
use serde_json;

// TODO: get rid of these structs
/// The result of a response
pub type ResponseValue = Result<Vec<u8>, ResponseError>;

pub enum ResponseError {
    /// Indicates that a response did not arrive in time
    Timeout,
}

pub struct Player {
    id: ClientId,
    num: usize,
    handle: ClientReactorHandle,
}

impl Player {
    fn prompt(&mut self, state: proto::State, deadline: Instant) {
        self.request(proto::ServerMessage::GameState(state), deadline);
    }

    fn send_final_state(&mut self, state: proto::State) {
        self.send(proto::ServerMessage::FinalState(state));
    }

    fn send_action(&mut self, action: PlayerAction) {
        self.send(proto::ServerMessage::PlayerAction(action));
    }

    fn request(&mut self, msg: proto::ServerMessage, deadline: Instant) {
        let data = serde_json::to_vec(&msg).unwrap();
        // TODO
        // self.handle.request(data, deadline);
    }

    fn send(&mut self, msg: proto::ServerMessage) {
        let data = serde_json::to_vec(&msg).unwrap();
        // TODO
        // self.handle.send(data);
    }
}

pub struct ClientHandler {
    client_id: u32,
}

impl ClientHandler {
    pub fn new(client_id: u32) -> Self {
        ClientHandler {
            client_id,
        }
    }

    pub fn on_connect(&mut self, _event: &events::Connected) {
        println!("player connected");
    }
}

pub struct PwMatch {
    state: PwMatchState,
}

enum PwMatchState {
    Lobby(Lobby),
    Playing(PwController),
    Finished,
}

impl PwMatch {
    pub fn new(reactor_handle: CoreReactorHandle,
               routing_table: Arc<Mutex<RoutingTable>>,
               logger: slog::Logger)
               -> Self
    {
        let lobby = Lobby::new(
            routing_table,
            reactor_handle,
            logger
        );

        return PwMatch {
            state: PwMatchState::Lobby(lobby),
        }
    }

    fn take_state(&mut self) -> PwMatchState {
        mem::replace(&mut self.state, PwMatchState::Finished)
    }

    pub fn register_client(&mut self, event: &events::RegisterClient) {
        if let &mut PwMatchState::Lobby(ref mut lobby) = &mut self.state {
            let client_id = ClientId::new(event.client_id);
            lobby.add_player(client_id, event.token.clone());
        }
    }
}

impl Future for PwMatch {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            let event = unimplemented!();
            
            match self.take_state() {
                PwMatchState::Lobby(mut lobby) => {
                    // lobby.handle_event(event);
                    
                    if lobby.game_data.is_some() {
                        let pw_controller = PwController::new(lobby);
                        self.state = PwMatchState::Playing(pw_controller);
                    } else {
                        self.state = PwMatchState::Lobby(lobby);
                    }
                }

                PwMatchState::Playing(mut pw_controller) => {
                    // pw_controller.handle_event();

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

    routing_table: Arc<Mutex<RoutingTable>>,
    reactor_handle: CoreReactorHandle,

    game_data: Option<Vec<u8>>,
    players: HashMap<ClientId, ClientReactorHandle>,
    client_counter: u32,
}

impl Lobby {
    fn new(routing_table: Arc<Mutex<RoutingTable>>,
           reactor_handle: CoreReactorHandle,
           logger: slog::Logger)
           -> Self
    {
        return Lobby {
            logger,

            routing_table,
            reactor_handle,

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

    fn add_player(&mut self, client_id: ClientId, connection_token: Vec<u8>) {
        let connection = Connection::new(
            connection_token,
            client_id,
            self.routing_table.clone(),
        );
        let mut reactor = Reactor::new(ClientHandler::new(client_id.as_u32()));
        reactor.add_handler(ClientHandler::on_connect);
        let client_reactor = ClientReactor::new(
            reactor,
            connection,
        );
        self.players.insert(client_id, client_reactor.handle());
        tokio::spawn(client_reactor);
        println!("player added");
    }

    fn remove_player(&mut self, client_id: ClientId) {
        self.players.remove(&client_id);
    }
}

pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: slog::Logger,

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
        let serialized_state = serialize_state(&self.state);
        let message = proto::ControlMessage::GameState(serialized_state);
        let serialized = serde_json::to_vec(&message).unwrap();
        // TODO
        // self.ctrl_handle.send(serialized);
    }

    fn prompt_players(&mut self) {
        let deadline = Instant::now() + Duration::from_secs(1);
        let serialized = serialize_state(&self.state);

        // these borrows are required so that the retain closure
        // does not have to borrow self (which would create a lifetime conflict)
        let state = &self.state;
        let waiting_for = &mut self.waiting_for;

        self.players.retain(|_, player| {
            if state.players[player.num].alive {
                waiting_for.insert(player.id);
                player.prompt(serialized.clone(), deadline);
                // keep this player in the game
                return true;
            } else {
                player.send_final_state(serialized.clone());
                // this player is dead, kick him!
                return false;
            }
        });
    }

    // TODO: ewwwww dup
    fn finish_game(&mut self) {
        let serialized = serialize_state(&self.state);

        self.players.retain(|_player_id, player| {
            player.send_final_state(serialized.clone());
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

    fn handle_event(&mut self) {
        // EventContent::Response { value, .. } => {
        //     // we only send requests to players, so we do not have to check
        //     // whether the responder is a player
        //     self.commands.insert(event.client_id, value);
        //     self.waiting_for.remove(&event.client_id);
        // }

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