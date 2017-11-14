use std::collections::{HashSet, HashMap};

use planetwars::client_handle::ClientHandle;
use planetwars::rules::PlanetWars;
use planetwars::logger::PlanetWarsLogger;
use planetwars::protocol as proto;


struct Controller {
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
            self.prompt_players(handles);
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
        
    fn prompt_players(&mut self, handles: &mut HashMap<usize, Client>) {
        for player in self.state.players.values() {
            if player.alive {
                let handle = handles.get_mut(&player.id).unwrap();
                handle.send(self.state.repr());
                self.waiting_for.insert(player.id);
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

    fn poll(&mut self) -> Poll<(), ()> {
        while !self.state.is_finished() {
            let msg = try_ready!(self.client_msgs.poll());
            // TODO: handle message
            self.step();
        }
        Ok(Async::Ready(self.state.living_players()))
    }
}
