use planetwars::rules::PlanetWars;
use planetwars::logger::PlanetWarsLogger;
use planetwars::protocol as proto;
use std::collections::HashSet;

struct Controller {
    state: PlanetWars,
    logger: PlanetWarsLogger,
    waiting_for: HashSet<usize>,
    dispatches: Vec<proto::Move>,
}

#[derive(Debug)]
enum MoveError {
    NonexistentPlanet,
    PlanetNotOwned,
    NotEnoughShips,
}

impl Controller {
    pub fn handle_command(&mut self, player_id: usize, cmd: proto::Command) {
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
