extern crate serde_json;

use std::collections::HashMap;
use std::rc::{Rc, Weak};
use std::cell::{RefCell};

use game::*;
use games::planetwars::protocol::*;
use games::planetwars::planet_gen::{gen_map};

const START_SHIPS: u64 = 15;

pub struct PlanetWars<'g> {
    players: PlayerMap<'g, Rc<RefCell<Player>>>,
    planets: HashMap<String, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

impl<'g> Game<'g> for PlanetWars<'g> {
    type Outcome = PlayerMap<'g, u64>;
    type Config = ();
    
    fn init(config: MatchParams<'g, Self>) -> (Self, GameStatus<'g, Self>) {

        // Transform to HashMap<PlayerId, Rc<RefCell<Player>>>
        let mut players = HashMap::new();
        for name in config.players.iter() {
            players.insert(
                name.clone(),
                Rc::new(RefCell::new( Player { name: name.to_string() }))
            );
        }
        let mut state = PlanetWars {
            planets: gen_map(players.len()),
            players: players,
            expeditions: Vec::new(),
            
        };

        state.place_players();

        // let state = self.to_state();

        // for (name, player) in &self.players {
        //     let inp = serde_json::to_string(&state)
        //         .expect("[PLANET_WARS] Serializing game state failed.");
        //     pi.insert(name.clone(), inp);
        // }
        unimplemented!()
    }

    fn step(&mut self, player_output: &PlayerMap<'g, String>) -> GameStatus<'g, Self> {
        for (player, command) in player_output {

            // Parse command
            let c: Command = match serde_json::from_str(command) {
                Ok(command) => command,
                // TODO: More expressive error
                Err(err) => {
                    let msg = format!("Invalid formatted command.\n{}", err);
                    unimplemented!()
                } 
            };

            let moof = match c.value {
                Some(moof) => moof,
                None => continue // No move by player, skip
            };

            // let moof = match self.validate_move(moof) {
            //     Ok(moof) => moof,
            //     Err(outcome) => return GameStatus::Done(outcome)
            // }; 

            let exp = self.exp_from_move(player.clone(), moof);
            // Add expedition to planet
        }

        self.step_expeditions();
        self.resolve_combats();
        unimplemented!()
    }
}

impl<'g> PlanetWars<'g> {
//    fn validate_move(&mut self, m: Move) -> Result<Move, Outcome>{
        // Check whether origin is a valid planet
        /*
        let or = match self.planets.get(&c.origin) {
            Some(planet) => planet,
            None => return faulty_command("Origin is not a valid planet")
        };

        // Check whether dest is a valid planet
        let dest = match self.planets.get(&c.destination) {
            Some(planet) => planet,
            None => return faulty_command("Destination is not a valid planet")
        };

        if or.owner != *player {
            return faulty_command("You don't own this planet")
        }

        if or.ship_count < c.ship_count {
            return faulty_command("You don't control enough ships to send this amount")
        }*/
  //      Ok(m)
    //}

    fn generate_prompts(&self) -> PlayerMap<'g, String> {
        unimplemented!()
    }

    fn to_state(&mut self) -> State {
        let players = Vec::new();
        let planets = Vec::new();
        let expeditions = Vec::new();
        // TODO
        State {
            players: players,
            planets: planets,
            expeditions: expeditions
        }

    }

    fn exp_from_move(&mut self, player_name: PlayerId, m: Move) -> Expedition {
        let owner = self.players.get(&player_name).unwrap(); // Add error message
        let fleet = Fleet {
            owner: Rc::downgrade(owner), 
            ship_count: m.ship_count
        };

        let target = self.planets.get(m.destination.as_str()).unwrap(); // Add error message
        Expedition {
            target: Rc::downgrade(target), 
            fleet: fleet,
            turns_remaining: 5
        }
    }

    fn step_expeditions(&mut self) {
        let mut i = 0;
        let exps = &mut self.expeditions;
        while i < exps.len() {
            exps[i].turns_remaining -= 1;
            if exps[i].turns_remaining == 0 {
                exps.swap_remove(i).into_orbit();
            } else {
                i += 1;
            }
        }
    }

    fn resolve_combats(&mut self) {
        for planet in self.planets.values() {
            planet.borrow_mut().resolve_combat();
        }
    }

    fn place_players(&mut self) {
        let mut values = self.planets.values_mut().take(self.players.len());
        for (player_name, player) in &self.players {
            let mut value : &mut Rc<RefCell<Planet>> = values.next()
                .expect("Not enough planets generated for players.");
            let mut value = Rc::get_mut(value).unwrap().borrow_mut();
            value.fleets.push( Fleet {
                owner: Rc::downgrade(&player),
                ship_count: START_SHIPS
            });
        }
    }
}

pub struct Fleet {
    owner: Weak<RefCell<Player>>,
    ship_count: u64,
}

pub struct Planet {
    name: String,
    fleets: Vec<Fleet>,
    x: u64,
    y: u64,
}

impl Planet {
    pub fn new(name: String, fleets: Vec<Fleet>, x: u64, y: u64) -> Planet {
        Planet {
            name: name,
            fleets: fleets,
            x: x,
            y: y
        }
    }

    fn orbit(&mut self, fleet: Fleet) {
        // TODO: deduplication (merge fleets from same player)
        self.fleets.push(fleet);
    }

    fn resolve_combat(&mut self) {
        // destroy some ships
        self.fleets.sort_by(|a, b| a.ship_count.cmp(&b.ship_count).reverse());
        while self.fleets.len() > 1 {
            let fleet = self.fleets.pop().unwrap();
            for other in self.fleets.iter_mut() {
                other.ship_count -= fleet.ship_count;
            }

            // remove dead fleets
            while self.fleets[self.fleets.len()-1].ship_count == 0 {
                self.fleets.pop();
            }
        }
    }
}

struct Expedition {
    target: Weak<RefCell<Planet>>,
    fleet: Fleet,
    turns_remaining: u64,
}

impl Expedition {
    fn into_orbit(self) {
        let target_ref = self.target.upgrade().unwrap();
        target_ref.borrow_mut().orbit(self.fleet);
    }
}

struct Player {
    name: String,

}

impl PartialEq for Player {
    fn eq(&self, other: &Player) -> bool {
        self.name == other.name
    }
}
