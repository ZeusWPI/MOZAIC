use std::collections::HashMap;

use futures::{Future, Poll, Async};
use futures::sync::mpsc::UnboundedReceiver;
use client_controller::ClientMessage;
use std::time::{Duration, Instant};

use planetwars::modules::Config;
use planetwars::modules::pw_rules::{PlanetWars, Dispatch};
use planetwars::modules::pw_serializer::{serialize, serialize_rotated};
use planetwars::modules::pw_protocol as proto;
use planetwars::player_lock::{PlayerLock, RequestResult};
use planetwars::controller::{PlayerId, Client};

use slog;
use serde_json;


pub struct PwController {
    lock: PlayerLock,
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: slog::Logger,
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
               clients: Vec<Client>,
               client_msgs: UnboundedReceiver<ClientMessage>,
               logger: slog::Logger)
               -> Self
    {
        let state = conf.create_game(clients.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let players = clients.into_iter().map(|client| {
            (client.id, client.handle)
        }).collect();


        let mut controller = PwController {
            lock: PlayerLock::new(players, client_msgs),
            state,
            planet_map,
            logger,
        };
        controller.init();
        return controller;
    }

    pub fn init(&mut self){
        self.log_state();
        self.prompt_players();
    }

    /// Advance the game by one turn.
    pub fn step(&mut self, messages: HashMap<PlayerId, RequestResult>) {
        self.state.repopulate();
        self.execute_messages(messages);
        self.state.step();

        self.log_state();

        if !self.state.is_finished() {
            self.prompt_players();
        }
    }

    pub fn outcome(&self) -> Option<Vec<PlayerId>> {
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
        let deadline = Instant::now() + Duration::from_millis(100);
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
            let input = try_ready!(self.lock.poll());
            self.step(input);
            if self.state.is_finished() {
                return Ok(Async::Ready(()));
            }
        }
    }
}