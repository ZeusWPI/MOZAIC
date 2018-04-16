use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};

use futures::{Future, Poll, Async};

use players::{PlayerId, PlayerHandler};
use utils::{PlayerLock, RequestResult};
use connection::router::RoutingTable;

use super::Config;
use super::pw_rules::{PlanetWars, Dispatch};
use super::pw_serializer::{serialize, serialize_rotated};
use super::pw_protocol as proto;

use slog;
use serde_json;


pub struct PwController {
    lock: PlayerLock,
    game_state: GameState,
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: slog::Logger,
}


enum GameState {
    /// Waiting for players to connect
    Connecting,
    /// Game is in progress
    Playing,
    /// Game has terminated
    Finished,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum CommandError {
    NotEnoughShips,
    OriginNotOwned,
    ZeroShipMove,
    OriginDoesNotExist,
    DestinationDoesNotExist,
}

impl PwController {
    pub fn new(conf: Config,
               client_tokens: Vec<Vec<u8>>,
               routing_table: Arc<Mutex<RoutingTable>>,
               logger: slog::Logger)
               -> Self
    {
        let state = conf.create_game(client_tokens.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut player_handler = PlayerHandler::new(routing_table);
        for (player_num, token) in client_tokens.into_iter().enumerate() {
            let player_id = PlayerId::new(player_num);
            player_handler.add_player(player_id, token);
        }

        let mut controller = PwController {
            lock: PlayerLock::new(player_handler),
            game_state: GameState::Connecting,
            state,
            planet_map,
            logger,
        };

        // TODO: put this somewhere else
        // Send hello's to all players. Once they reply, we know they have
        // connected and the game can begin.
        let deadline = Instant::now() + Duration::from_secs(60);
        for player in controller.state.players.iter() {
            let msg = "hello".to_string().into_bytes();
            controller.lock.request(player.id, msg, deadline);
        }

        return controller;
    }

    /// Check whether all players have succesfully connected.
    fn connect(&mut self, messages: HashMap<PlayerId, RequestResult>) {
        // TODO: proper logging
        for (player_id, response) in messages.into_iter() {
            match response {
                Err(_) => {
                    println!("player {} did not connect", player_id.as_usize());
                    self.game_state = GameState::Finished;
                    return;
                },
                Ok(_) => {}
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
    fn step(&mut self, messages: HashMap<PlayerId, RequestResult>) {
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

                let serialized = serialize_rotated(&self.state, offset);
                let request = serde_json::to_vec(&serialized).unwrap();
                self.lock.request(player.id, request, deadline);
            }
        }
    }

    fn execute_messages(&mut self, mut msgs: HashMap<PlayerId, RequestResult>) {
        for (player_id, result) in msgs.drain() {
            // TODO: log received message.
            // TODO: this should probably happen in the lock as well, so that
            //       we have a correct timestamp.
            if let Ok(message) = result {
                self.execute_message(player_id, message);
            } else {
                // TODO: log
            }
        }
    }

    /// Parse and execute a player message.
    fn execute_message(&mut self, player_id: PlayerId, msg: Vec<u8>) {
        match serde_json::from_slice(&msg) {
            Ok(action) => {
                self.execute_action(player_id, action);
            },
            Err(err) => {
                info!(self.logger, "parse error";
                    "player_id" => player_id.as_usize(),
                    "error" => err.to_string()
                );
            },
        };
    }

    fn execute_action(&mut self, player_id: PlayerId, action: proto::Action) {
        for cmd in action.commands.iter() {
            match self.parse_command(player_id, &cmd) {
                Ok(dispatch) => {
                    info!(self.logger, "dispatch";
                        player_id,
                        cmd);
                    self.state.dispatch(&dispatch);
                },
                Err(err) => {
                    info!(self.logger, "illegal command";
                        player_id,
                        cmd,
                        "error" => serde_json::to_string(&err).unwrap());
                }
            }
        }
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
            match self.game_state {
                GameState::Connecting => {
                    // once all players gave a sign of life, the game can start.
                    let responses = try_ready!(self.lock.poll());
                    self.connect(responses);
                },
                GameState::Playing => {
                    let responses = try_ready!(self.lock.poll());
                    self.step(responses);
                },
                GameState::Finished => {
                    return Ok(Async::Ready(()));
                }
            }
        }
    }
}