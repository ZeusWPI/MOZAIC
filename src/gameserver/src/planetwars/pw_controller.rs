use std::collections::HashMap;
use futures::sync::mpsc::UnboundedSender;

use planetwars::Config;
use planetwars::rules::{PlanetWars, Dispatch};
use planetwars::controller::Client;
use planetwars::protocol as proto;
use planetwars::serializer::{serialize, serialize_rotated};

use slog;
use serde_json;


pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,

    client_handles: HashMap<usize, UnboundedSender<String>>,
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
    pub fn new(conf: Config, clients: Vec<Client>) -> Self {
        let state = conf.create_game(clients.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        unimplemented!()
    }

    /// Advance the game by one turn.
    fn step(&mut self) {
        self.state.repopulate();
        self.execute_messages();
        self.state.step();

        self.log_state();

        if !self.state.is_finished() {
            self.prompt_players();
        }
    }

    pub fn log_state(&self) {
        // TODO: add turn number
        info!(self.logger, "game state";
            "step" => serialize(&self.state));
    }

    fn prompt_players(&mut self) {
        for player in self.state.players.iter() {
            if player.alive {
                // how much we need to rotate for this player to become
                // player 0 in his state dump
                let offset = self.state.players.len() - player.id;

                let serialized = serialize_rotated(&self.state, offset);
                let repr = serde_json::to_string(&serialized).unwrap();
                let handle = self.client_handles.get_mut(&player.id).unwrap();
                handle.unbounded_send(repr).unwrap();
                self.waiting_for.insert(player.id);
            }
        }
    }

        fn execute_messages(&mut self) {
        let mut messages = mem::replace(
            &mut self.messages,
            HashMap::with_capacity(self.client_handles.len())
        );
        for (client_id, message) in messages.drain() {
            self.execute_message(client_id, message);
        }
    }

    /// Parse and execute a player message.
    fn execute_message(&mut self, player_id: usize, msg: String) {
        match serde_json::from_str(&msg) {
            Ok(action) => {
                self.execute_action(player_id, action);
            },
            Err(err) => {
                info!(self.logger, "parse error";
                    "client_id" => player_id,
                    "error" => err.to_string()
                );
            },
        };
    }

    fn execute_action(&mut self, player_id: usize, action: proto::Action) {
        for cmd in action.commands.iter() {
            let log_keys = o!(
                "client_id" => player_id,
                // TODO: this is not nice, a solution will become
                // available in the slog crate.
                "command" => serde_json::to_string(&action).unwrap()
            );
            match self.parse_command(player_id, &cmd) {
                Ok(dispatch) => {
                    info!(self.logger, "dispatch"; log_keys);
                    self.state.dispatch(&dispatch);
                },
                Err(_err) => {
                    // TODO: include actual error
                    info!(self.logger, "illegal command"; log_keys);
                }
            }
        }
    }

    fn parse_command(&self, player_id: usize, mv: &proto::Command)
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