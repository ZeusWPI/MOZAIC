use std::collections::{HashSet, HashMap};

use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use serde_json;

use client_controller::ClientMessage;
use planetwars::config::Config;
use planetwars::rules::{PlanetWars, Player};
use planetwars::logger::PlanetWarsLogger;
use planetwars::protocol as proto;


pub struct Controller {
    state: PlanetWars,
    logger: PlanetWarsLogger,
    waiting_for: HashSet<usize>,
    dispatches: Vec<proto::Move>,

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
               // temporary: player names
               // this should probaly go in the match config later on
               player_names: HashMap<usize, String>,
               chan: UnboundedReceiver<ClientMessage>,
               conf: Config,)
               -> Self
    {
        // TODO: this should be replaced by something nicer
        let player_map = player_names.into_iter().map(|(id, name)| {
            let player = Player {
                id: id,
                name: name,
                alive: true,
            };
            return (id, player);
        }).collect();
        
        let state = conf.create_game(player_map);
        
        let mut logger = PlanetWarsLogger::new("log.json");
        logger.log(&state).expect("[PLANET_WARS] logging failed");
        
        let mut controller = Controller {
            state: state,
            logger: logger,

            waiting_for: HashSet::with_capacity(clients.len()),
            dispatches: Vec::new(),
            
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
        for mv in self.dispatches.drain(0..) {
            self.state.dispatch(&mv);
        }
        
        self.state.step();
        self.logger.log(&self.state).expect("[PLANET WARS] logging failed");

        if !self.state.is_finished() {
            self.prompt_players();
        }
    }

        
    fn prompt_players(&mut self) {
        for player in self.state.players.values() {
            if player.alive {
                let state = self.state.repr();
                let repr = serde_json::to_string(&state).unwrap();
                let handle = self.client_handles.get_mut(&player.id).unwrap();
                handle.unbounded_send(repr).unwrap();
                self.waiting_for.insert(player.id);
            }
        }
    }

    
    fn handle_message(&mut self, player_id: usize, msg: String) {
        if let Ok(cmd) = serde_json::from_str(&msg) {
            self.handle_command(player_id, cmd);
        }
        self.waiting_for.remove(&player_id);
    }

    fn handle_command(&mut self, player_id: usize, cmd: proto::Command) {
        for mv in cmd.moves.into_iter() {
            let res = self.handle_move(player_id, mv);
            if let Err(err) = res {
                // TODO: this is where errors should be sent to clients
                println!("player {}: {:?}", player_id, err);
            }
        }
    }
        
    fn handle_move(&mut self, player_id: usize, mv: proto::Move)
                   -> Result<(), MoveError>
    {
        // check whether origin and target exist
        if !self.state.planets.contains_key(&mv.origin) {
            return Err(MoveError::NonexistentPlanet);
        }
        if !self.state.planets.contains_key(&mv.destination) {
            return Err(MoveError::NonexistentPlanet);
        }

        // check whether player owns origin and has enough ships there
        let origin = &self.state.planets[&mv.origin];
        
        if origin.owner() != Some(player_id) {
            return Err(MoveError::PlanetNotOwned);
        }
        if origin.ship_count() < mv.ship_count {
            return Err(MoveError::NotEnoughShips);
        }

        self.dispatches.push(mv);
        Ok(())
    }
}

impl Future for Controller {
    type Item = Vec<String>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<String>, ()> {
        while !self.state.is_finished() {
            let msg = try_ready!(self.client_msgs.poll()).unwrap();
            self.handle_message(msg.client_id, msg.message);
            self.step();
        }
        Ok(Async::Ready(self.state.living_players()))
    }
}
