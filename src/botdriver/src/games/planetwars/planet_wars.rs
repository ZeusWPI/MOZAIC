use std::collections::HashMap;

use std::rc::{Rc, Weak};
use std::cell::{RefCell, RefMut};

use game_types::*;
use game_types::Player as PlayerName;

use games::planetwars::protocol::*;

pub struct PlanetWars {
    players: HashMap<String, Rc<RefCell<Player>>>,
    planets: HashMap<String, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

impl Game for PlanetWars {
    fn init(names: Vec<PlayerName>) -> Self {
        unimplemented!()
    }

    fn start(&mut self) -> GameStatus {
        unimplemented!()
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        self.step_expeditions();
        self.resolve_combats();
        unimplemented!()
    }
}


impl PlanetWars {
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
}

struct Fleet {
    owner: Weak<RefCell<Player>>,
    ship_count: u64,
}

struct Planet {
    name: String,
    fleets: Vec<Fleet>,
    x: f64,
    y: f64,
}

impl Planet {
    fn orbit(&mut self, fleet: Fleet) {
        // TODO: deduplication
        self.fleets.push(fleet);
    }
}

impl Planet {
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