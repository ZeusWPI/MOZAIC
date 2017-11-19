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


pub struct Controller {
    state: PlanetWars,
    planet_map: HashMap<String, usize>,
    logger: PlanetWarsLogger,
    waiting_for: HashSet<usize>,

    commands: HashMap<usize, String>,

    client_handles: HashMap<usize, UnboundedSender<String>>,
    client_msgs: UnboundedReceiver<ClientMessage>,
}

#[derive(Debug)]
enum MoveError {
    NonexistentPlanet,
    PlanetNotOwned,
    NotEnoughShips,
}

impl Controller {
    pub fn new(clients: HashMap<usize, UnboundedSender<String>>,
               chan: UnboundedReceiver<ClientMessage>,
               conf: Config,)
               -> Self
    {
        let state = conf.create_game(clients.len());

        let mut logger = PlanetWarsLogger::new("log.json");
        logger.log(&state).expect("[PLANET_WARS] logging failed");

        let planet_map = state.planets.iter().map(|planet| {
            (planet.name.clone(), planet.id)
        }).collect();

        let mut controller = Controller {
            state: state,
            logger: logger,
            planet_map: planet_map,

            waiting_for: HashSet::with_capacity(clients.len()),
            commands: HashMap::with_capacity(clients.len()),

            client_handles: clients,
            client_msgs: chan,
        };
        controller.prompt_players();
        return controller;
    }

    pub fn step(&mut self) {
        if !self.waiting_for.is_empty() {
            return;
        }

        self.state.repopulate();
        self.handle_commands();
        self.state.step();

        self.logger.log(&self.state).expect("[PLANET WARS] logging failed");

        if !self.state.is_finished() {
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
                self.commands.insert(client_id, msg);
                self.waiting_for.remove(&client_id);
            },
            Message::Disconnected => {
                // TODO: handle this case gracefully
                panic!("CLIENT {} disconnected", client_id);
            }
        }
    }

    fn handle_commands(&mut self) {
        let commands = mem::replace(
            &mut self.commands,
            HashMap::with_capacity(self.client_handles.len())
        );
        for (&client_id, message) in commands.iter() {
            match serde_json::from_str(&message) {
                Ok(cmd) => {
                    self.handle_command(client_id, &cmd);
                },
                Err(_) => {
                    // TODO
                }
            }
        }
    }

    fn handle_command(&mut self, player_id: usize, cmd: &proto::Command) {
        for mv in cmd.moves.iter() {
            match self.parse_move(player_id, mv) {
                Ok(dispatch) => self.state.dispatch(dispatch),
                Err(err) => {
                    // TODO: this is where errors should be sent to clients
                    println!("player {}: {:?}", player_id, err);
                }
            }
        }
    }

    fn parse_move(&self, player_id: usize, mv: &proto::Move)
                  -> Result<Dispatch, MoveError>
    {
        let origin_id = *self.planet_map
            .get(&mv.origin)
            .ok_or(MoveError::NonexistentPlanet)?;

        let target_id = *self.planet_map
            .get(&mv.destination)
            .ok_or(MoveError::NonexistentPlanet)?;

        if self.state.planets[origin_id].owner() != Some(player_id) {
            return Err(MoveError::PlanetNotOwned);
        }

        if self.state.planets[origin_id].ship_count() < mv.ship_count {
            return Err(MoveError::NotEnoughShips);
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
