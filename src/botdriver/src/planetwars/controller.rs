use std::collections::{HashSet, HashMap};

use futures::{Future, Async, Poll, Stream, Sink};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

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
    client_msgs: UnboundedReceiver<String>,
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
               chan: UnboundedReceiver<String>,
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
        
        Controller {
            state: state,
            logger: logger,

            waiting_for: HashSet::with_capacity(clients.len()),
            dispatches: Vec::new(),
            
            client_handles: clients,
            client_msgs: chan,
        }
    }
    pub fn game_finished(&self) -> bool {
        self.state.is_finished()
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
        self.logger.log(&self.state);

        if !self.state.is_finished() {
            self.prompt_players();
        }
    }

    
    pub fn handle_command(&mut self, player_id: usize, cmd: proto::Command) {
        for mv in cmd.moves.into_iter() {
            let res = self.handle_move(player_id, mv);
            if let Err(err) = res {
                // TODO: this is where errors should be sent to clients
                println!("player {}: {:?}", player_id, err);
            }
        }
    }
        
    fn prompt_players(&mut self) {
        for player in self.state.players.values() {
            if player.alive {
                // TODO
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
            let msg = try_ready!(self.client_msgs.poll());
            // TODO: handle message
            self.step();
        }
        Ok(Async::Ready(self.state.living_players()))
    }
}
