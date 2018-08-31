use std::collections::{HashMap, HashSet};
use std::time::{Duration, Instant};
use std::mem;

use events;
use network::connection_table::{ClientId};
use network::connection_handler::ConnectionHandle;
use reactors::reactor::ReactorHandle;
use reactors::ReactorCore;
use server::ConnectionManager;

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
    handle: ConnectionHandle,
}

pub struct ClientHandler {
    client_id: u32,
    reactor_handle: ReactorHandle,
}

impl ClientHandler {
    pub fn new(client_id: u32, reactor_handle: ReactorHandle) -> Self {
        ClientHandler {
            client_id,
            reactor_handle,
        }
    }

    pub fn on_connect(&mut self, _event: &events::Connected) {
        self.reactor_handle.dispatch(events::ClientConnected {
            client_id: self.client_id,
        });
    }

    pub fn on_disconnect(&mut self, _event: &events::Disconnected) {
        self.reactor_handle.dispatch(events::ClientDisconnected {
            client_id: self.client_id,
        });
    }

    pub fn on_message(&mut self, event: &events::ClientSend) {
        self.reactor_handle.dispatch(events::ClientMessage {
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
    pub fn new(reactor_handle: ReactorHandle,
               connection_manager: ConnectionManager)
               -> Self
    {
        let lobby = Lobby::new(
            connection_manager,
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
                max_turns: event.max_turns as u64,
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
    connection_manager: ConnectionManager,
    reactor_handle: ReactorHandle,

    players: HashMap<ClientId, ConnectionHandle>,
}

impl Lobby {
    fn new(connection_manager: ConnectionManager,
           reactor_handle: ReactorHandle)
           -> Self
    {
        return Lobby {
            connection_manager,
            reactor_handle,

            players: HashMap::new(),
            // start counter at 1, because 0 is the control client
        }
    }

    fn add_player(&mut self, client_id: ClientId, connection_token: Vec<u8>) {
        let mut core = ReactorCore::new(
            ClientHandler::new(
                client_id.as_u32(),
                self.reactor_handle.clone(),
            ),
        );

        core.add_handler(ClientHandler::on_connect);
        core.add_handler(ClientHandler::on_disconnect);
        core.add_handler(ClientHandler::on_message);

        let handle = self.connection_manager
            .create_connection(connection_token, |_| core);

        self.players.insert(client_id, handle);
    }

    fn remove_player(&mut self, client_id: ClientId) {
        self.players.remove(&client_id);
    }
}

pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    reactor_handle: ReactorHandle,

    client_player: HashMap<ClientId, usize>,
    players: HashMap<ClientId, Player>,

    waiting_for: HashSet<ClientId>,
    commands: HashMap<ClientId, String>,
}

impl PwController {
    pub fn new(config: Config,
               reactor_handle: ReactorHandle,
               clients: HashMap<ClientId, ConnectionHandle>)
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
        // TODO: fix this
        let state = serde_json::to_string(&serialize_state(&self.state)).unwrap();

        if self.state.is_finished() {
            let event = events::GameFinished { turn_num, state };
            self.reactor_handle.dispatch(event);
        } else {
            let event = events::GameStep { turn_num, state };
            self.reactor_handle.dispatch(event);
        }
    }

    fn on_step(&mut self, step: &events::GameStep) {
        let state = &self.state;
        let waiting_for = &mut self.waiting_for;

        self.players.retain(|_, player| {
            if state.players[player.num].alive {
                waiting_for.insert(player.id);
                player.handle.dispatch(events::GameStep {
                    turn_num: step.turn_num,
                    state: step.state.clone(),
                });
                // keep this player in the game
                return true;
            } else {
                player.handle.dispatch(events::GameFinished {
                    turn_num: step.turn_num,
                    state: step.state.clone(),
                });
                // this player is dead, kick him!
                // TODO: shutdown the reactor
                return false;
            }
        });

        let deadline = Instant::now() + Duration::from_secs(1);
        self.reactor_handle.dispatch_at(deadline, events::TurnTimeout {
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
            player.handle.dispatch(events::GameFinished {
                turn_num: event.turn_num,
                state: event.state.clone(),
            });
            // game is over, kick everyone.
            false
        });
        self.reactor_handle.quit();
    }

    fn on_timeout(&mut self, event: &events::TurnTimeout) {
        if self.state.turn_num == event.turn_num {
            self.step();
        }
    }

    fn player_commands(&mut self) -> HashMap<ClientId, Option<String>> {
        let commands = &mut self.commands;
        return self.players.values().map(|player| {
            let command = commands.remove(&player.id);
            return (player.id, command);
        }).collect();
    }

    fn execute_commands(&mut self) {
        let mut commands = self.player_commands();

        for (player_id, command) in commands.drain() {
            let player_num = self.players[&player_id].num;
            let action = self.execute_action(player_num, command);
            let serialized_action = serde_json::to_string(&action).unwrap();
            self.reactor_handle.dispatch(events::PlayerAction {
                client_id: player_id.as_u32(),
                action: serialized_action.clone(),
            });
            self.players
                .get_mut(&player_id)
                .unwrap()
                .handle
                .dispatch(events::PlayerAction {
                    client_id: player_id.as_u32(),
                    action: serialized_action,
                });
        }
    }

    fn execute_action(&mut self, player_num: usize, response: Option<String>)
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
}