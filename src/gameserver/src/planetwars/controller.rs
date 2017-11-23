use std::collections::{HashSet, HashMap};
use std::mem;

use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use serde_json;

use client_controller::{ClientMessage, Message};
use planetwars::config::Config;
use planetwars::rules::{PlanetWars, Dispatch};
use planetwars::logger::PlanetWarsLogger;
use planetwars::serializer::serialize_rotated;
use planetwars::protocol as proto;

use slog;
use slog::Drain;
use slog_json;
use std::sync::Mutex;

use std::fs::File;

/// The controller forms the bridge between game rules and clients.
/// It is responsible for communications, the control flow, and logging.
pub struct Controller {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    pw_logger: PlanetWarsLogger,
    logger: slog::Logger,


    // Ids of players which we need a command for
    waiting_for: HashSet<usize>,

    // The commands we already received
    messages: HashMap<usize, String>,

    client_handles: HashMap<usize, UnboundedSender<String>>,
    client_msgs: UnboundedReceiver<ClientMessage>,
}

/// What went wrong when trying to perform a move.
// TODO: add some more information here
#[derive(Debug, Serialize, Deserialize)]
pub enum CommandError {
    NonexistentPlanet,
    PlanetNotOwned,
    NotEnoughShips,
}

impl Controller {
    // TODO: this method does both controller initialization and game staritng.
    // It would be nice to split these.
    pub fn new(clients: HashMap<usize, UnboundedSender<String>>,
               chan: UnboundedReceiver<ClientMessage>,
               conf: Config,)
               -> Self
    {
        let state = conf.create_game(clients.len());

        let mut pw_logger = PlanetWarsLogger::new("game_log.json");
        pw_logger.log(&state).expect("[PLANET_WARS] logging failed");

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let log_file = File::create("log.json").unwrap();
        
        let logger = slog::Logger::root( 
            Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
            o!()
        );

        let mut controller = Controller {
            state: state,
            pw_logger: pw_logger,
            planet_map: planet_map,
            logger: logger,

            waiting_for: HashSet::with_capacity(clients.len()),
            messages: HashMap::with_capacity(clients.len()),

            client_handles: clients,
            client_msgs: chan,
        };
        controller.prompt_players();
        return controller;
    }

    fn step(&mut self) {
        if !self.waiting_for.is_empty() {
            return;
        }

        self.state.repopulate();
        self.execute_messages();
        self.state.step();

        self.pw_logger.log(&self.state).expect("[PLANET WARS] logging failed");

        if !self.state.is_finished() {
            info!(self.logger, "starting turn"; "turn" => self.state.turn_num);
            self.prompt_players();
        }
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


    fn handle_message(&mut self, client_id: usize, msg: Message) {
        match msg {
            Message::Data(msg) => {
                info!(self.logger, "message received";
                        "client_id" => client_id,
                        "content" => &msg,
                );

                self.messages.insert(client_id, msg);
                self.waiting_for.remove(&client_id);
            },
            Message::Disconnected => {
                // TODO: handle this case gracefully
                panic!("CLIENT {} disconnected", client_id);
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
                        // TODO: this is not nice, a solution will become
                        // available in the slog crate.
                        "dispatch" => serde_json::to_string(&action).unwrap()
                    );
                    self.state.dispatch(&dispatch);
                },
                Err(_err) => {
                    // TODO: also log actual error
                    info!(self.logger, "illegal command";
                        "client_id" => player_id,
                        "command" => serde_json::to_string(&action).unwrap()
                    );
                }
            }
        }
    }

    fn parse_command(&self, player_id: usize, mv: &proto::Command)
                     -> Result<Dispatch, CommandError>
    {
        let origin_id = *self.planet_map
            .get(&mv.origin)
            .ok_or(CommandError::NonexistentPlanet)?;

        let target_id = *self.planet_map
            .get(&mv.destination)
            .ok_or(CommandError::NonexistentPlanet)?;

        if self.state.planets[origin_id].owner() != Some(player_id) {
            return Err(CommandError::PlanetNotOwned);
        }

        if self.state.planets[origin_id].ship_count() < mv.ship_count {
            return Err(CommandError::NotEnoughShips);
        }

        Ok(Dispatch {
            origin: origin_id,
            target: target_id,
            ship_count: mv.ship_count,
        })
    }
}

impl Future for Controller {
    type Item = Vec<usize>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<usize>, ()> {
        while !self.state.is_finished() {
            let msg = try_ready!(self.client_msgs.poll()).unwrap();
            self.handle_message(msg.client_id, msg.message);
            self.step();
        }
        Ok(Async::Ready(self.state.living_players()))
    }
}
