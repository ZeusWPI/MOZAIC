use std::collections::HashMap;
use std::collections::HashSet;

use planetwars::modules::Config;
use planetwars::modules::pw_rules::{PlanetWars, Dispatch};
use planetwars::modules::pw_serializer::{serialize, serialize_rotated};
use planetwars::modules::pw_protocol as proto;
use planetwars::controller::Client;
use planetwars::game_controller::GameController;

use slog;
use serde_json;


pub struct PwController {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    client_map: HashMap<usize, Client>,
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
    fn log_state(&self) {
        // TODO: add turn number
        info!(self.logger, "step";
            "state" => serialize(&self.state));
    }

    fn log_info(&self) {
        let info = proto::GameInfo {
            players: self.client_map.values().map(|c| {
                c.player_name.clone()
            }).collect(),
        };
        info!(self.logger, "game info";
            "info" => info);
    }

    fn prompt_players(&mut self) -> HashSet<usize> {
        let mut players = HashSet::new();
        for player in self.state.players.iter() {
            if player.alive {
                if let Some(client) = self.client_map.get_mut(&player.id) {
                    // how much we need to rotate for this player to become
                    // player 0 in his state dump
                    let offset = self.state.players.len() - player.id;

                    let serialized = serialize_rotated(&self.state, offset);
                    let repr = serde_json::to_string(&serialized).unwrap();
                    client.send_msg(repr);

                    players.insert(player.id);
                }
            }
        }
        return players;
    }

    fn execute_messages(&mut self, mut msgs:HashMap<usize, String>) {
        for (client_id, message) in msgs.drain() {
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
            match self.parse_command(player_id, &cmd) {
                Ok(dispatch) => {
                    info!(self.logger, "dispatch";
                        "client_id" => player_id,
                        cmd);
                    self.state.dispatch(&dispatch);
                },
                Err(err) => {
                    // TODO: include actual error
                    info!(self.logger, "illegal command";
                        "client_id" => player_id,
                        cmd,
                        "error" => serde_json::to_string(&err).unwrap());
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

impl GameController<Config> for PwController {
    fn new(conf: Config,
               clients: Vec<Client>,
               logger: slog::Logger)
               -> Self
    {
        let state = conf.create_game(clients.len());

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let client_map = clients.into_iter().map(|c| {
            (c.id, c)
        }).collect();

        PwController {
            state,
            planet_map,
            client_map,
            logger,
        }
    }

    fn start(&mut self) -> HashSet<usize>{
        self.log_info();
        self.log_state();

        self.prompt_players()
    }

    /// Advance the game by one turn.
    fn step(&mut self,
                msgs: HashMap<usize, String>,
        ) -> HashSet<usize>
    {
        self.state.repopulate();
        self.execute_messages(msgs);
        self.state.step();

        self.log_state();

        if !self.state.is_finished() {
            return self.prompt_players();
        }
        return HashSet::new();
    }

    fn outcome(&self) -> Option<Vec<usize>> {
        if self.state.is_finished() {
            Some(self.state.living_players())
        } else {
            None
        }
    }
}