use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use std::mem;

use tokio;

use reactors::reactor::Reactor;
use reactors::core_reactor::{CoreReactorHandle};
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

use serde_json;

pub struct Player {
    id: ClientId,
    num: usize,
    handle: ClientReactorHandle,
}

pub struct ClientHandler {
    client_id: u32,
    core_handle: CoreReactorHandle,
}

impl ClientHandler {
    pub fn new(client_id: u32, core_handle: CoreReactorHandle) -> Self {
        ClientHandler {
            client_id,
            core_handle,
        }
    }

    pub fn on_connect(&mut self, _event: &events::FollowerConnected) {
        self.core_handle.dispatch_event(events::ClientConnected {
            client_id: self.client_id,
        });
    }

    pub fn on_disconnect(&mut self, _event: &events::FollowerDisconnected) {
        self.core_handle.dispatch_event(events::ClientDisconnected {
            client_id: self.client_id,
        });
    }

    pub fn on_message(&mut self, event: &events::ClientSend) {
        self.core_handle.dispatch_event(events::ClientMessage {
            client_id: self.client_id,
            data: event.data.clone(),
        });
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
               routing_table: Arc<Mutex<RoutingTable>>)
               -> Self
    {
        let lobby = Lobby::new(
            routing_table,
            reactor_handle
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

    pub fn remove_client(&mut self, event: &events::RemoveClient) {
        if let PwMatchState::Lobby(ref mut lobby) = self.state {
            let client_id = ClientId::new(event.client_id);
            lobby.remove_player(client_id);
        }
    }

    pub fn start_game(&mut self, event: &events::StartGame) {
        let state = self.take_state();

        if let PwMatchState::Lobby(lobby) = state {
            let config = Config {
                map_file: event.map_path.clone(),
                max_turns: event.max_turns,
            };
            self.state = PwMatchState::Playing(PwController::new(
                config,
                lobby.reactor_handle,
                lobby.players,
            ));
        } else {
            self.state = state;
        }
    }

    pub fn game_step(&mut self, event: &events::GameStep) {
        if let PwMatchState::Playing(ref mut controller) = self.state {
            controller.on_step(event);
        }
    }

    pub fn client_message(&mut self, event: &events::ClientMessage) {
        if let PwMatchState::Playing(ref mut controller) = self.state {
            controller.on_client_message(event);
        }
    }

    pub fn game_finished(&mut self, event: &events::GameFinished) {
        let state = self.take_state();
        if let PwMatchState::Playing(mut controller) = state {
            controller.on_finished(event);
        }
        self.state = PwMatchState::Finished;
    }

    pub fn timeout(&mut self, event: &events::TurnTimeout) {
        if let PwMatchState::Playing(ref mut controller) = self.state {
            controller.on_timeout(event);
        }
    }
}

pub struct Lobby {
    routing_table: Arc<Mutex<RoutingTable>>,
    reactor_handle: CoreReactorHandle,

    players: HashMap<ClientId, ClientReactorHandle>,
}

impl Lobby {
    fn new(routing_table: Arc<Mutex<RoutingTable>>,
           reactor_handle: CoreReactorHandle)
           -> Self
    {
        return Lobby {
            routing_table,
            reactor_handle,

            players: HashMap::new(),
            // start counter at 1, because 0 is the control client
        }
    }

    fn add_player(&mut self, client_id: ClientId, connection_token: Vec<u8>) {
        let connection = Connection::new(
            connection_token,
            client_id,
            self.routing_table.clone(),
        );
        let mut reactor = Reactor::new(
            ClientHandler::new(
                client_id.as_u32(),
                self.reactor_handle.clone(),
            ),
        );
        reactor.add_handler(ClientHandler::on_connect);
        reactor.add_handler(ClientHandler::on_disconnect);
        reactor.add_handler(ClientHandler::on_message);
        let (handle, client_reactor) = ClientReactor::new(
            reactor,
            connection,
        );
        self.players.insert(client_id, handle);
        tokio::spawn(client_reactor);
    }

    fn remove_player(&mut self, client_id: ClientId) {
        self.players.remove(&client_id);
    }
}

pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    reactor_handle: CoreReactorHandle,

    client_player: HashMap<ClientId, usize>,
    players: HashMap<ClientId, Player>,

    waiting_for: HashSet<ClientId>,
    commands: HashMap<ClientId, String>,
}

impl PwController {
    pub fn new(config: Config,
               reactor_handle: CoreReactorHandle,
               clients: HashMap<ClientId, ClientReactorHandle>)
        -> Self
    {
        // TODO: we probably want a way to fixate player order
        let client_ids = clients.keys().cloned().collect();
        let state = config.create_game(client_ids);

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut client_player = HashMap::new();
        let mut players = HashMap::new();

        let clients_iter = clients.into_iter().enumerate();
        for (player_num, (client_id, client_handle)) in clients_iter {
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
            reactor_handle,

            waiting_for: HashSet::new(),
            commands: HashMap::new(),
        };
        // this initial dispatch starts the game
        controller.dispatch_state();
        return controller;
    }


    /// Advance the game by one turn.
    fn step(&mut self) {
        self.state.repopulate();
        self.execute_commands();
        self.state.step();

        self.dispatch_state();
    }

    fn dispatch_state(&mut self) {
        let turn_num = self.state.turn_num;
        let state = serialize_state(&self.state);

        if self.state.is_finished() {
            let event = events::GameFinished { turn_num, state };
            self.reactor_handle.dispatch_event(event);
        } else {
            let event = events::GameStep { turn_num, state };
            self.reactor_handle.dispatch_event(event);
        }
    }

    fn on_step(&mut self, step: &events::GameStep) {
        let state = &self.state;
        let waiting_for = &mut self.waiting_for;

        self.players.retain(|_, player| {
            if state.players[player.num].alive {
                waiting_for.insert(player.id);
                player.handle.dispatch_event(events::GameStep {
                    turn_num: step.turn_num,
                    state: step.state.clone(),
                });
                // keep this player in the game
                return true;
            } else {
                player.handle.dispatch_event(events::GameFinished {
                    turn_num: step.turn_num,
                    state: step.state.clone(),
                });
                // this player is dead, kick him!
                // TODO: shutdown the reactor
                return false;
            }
        });

        let deadline = Instant::now() + Duration::from_secs(1);
        self.reactor_handle.emit_delayed(deadline, events::TurnTimeout {
            turn_num: state.turn_num,
        });
    }

    fn on_client_message(&mut self, event: &events::ClientMessage) {
        let client_id = ClientId::new(event.client_id);
        self.waiting_for.remove(&client_id);
        self.commands.insert(client_id, event.data.clone());

        if self.waiting_for.is_empty() {
            self.step();
        }
    }

    fn on_finished(&mut self, event: &events::GameFinished) {
        self.players.retain(|_player_id, player| {
            player.handle.dispatch_event(events::GameFinished {
                turn_num: event.turn_num,
                state: event.state.clone(),
            });
            // game is over, kick everyone.
            false
        });
    }

    fn on_timeout(&mut self, event: &events::TurnTimeout) {
        if self.state.turn_num == event.turn_num {
            self.step();
        }
    }

    fn player_commands(&mut self) -> HashMap<usize, Option<String>> {
        let commands = &mut self.commands;
        return self.players.values().map(|player| {
            let command = commands.remove(&player.id);
            return (player.num, command);
        }).collect();
    }

    fn execute_commands(&mut self) {
        for player in self.players.values() {
            let command = self.commands.remove(&player.id);
            let action = self.parse_action(player.num, command);
            self.reactor_handle.dispatch_event(events::PlayerAction {
                client_id: player.id.as_u32(),
                action,
            });
        }
    }

    fn parse_action(&self, player_num: usize, response: Option<String>)
        -> PlayerAction
    {
        // TODO: it would be cool if this could be done with error_chain.

        let message = match response {
            None => return PlayerAction::Timeout,
            Some(message) => message,
        };

        let action: proto::Action = match serde_json::from_str(&message) {
            Err(err) => return PlayerAction::ParseError(err.to_string()),
            Ok(action) => action,
        };

        let commands = action.commands.into_iter().map(|command| {
            match self.parse_command(player_num, &command) {
                Ok(dispatch) => {
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
}