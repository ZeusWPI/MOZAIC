extern crate serde_json;

use std::collections::HashMap;
use std::rc::{Rc, Weak};
use std::cell::{RefCell, RefMut};

use game_types::*;
use game_types::Player as PlayerName;
use games::planetwars::protocol::*;
use games::planetwars::planet_gen::gen_planets;

pub struct PlanetWars {
    players: HashMap<PlayerName, Rc<RefCell<Player>>>,
    planets: HashMap<PlanetName, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

impl Game for PlanetWars {
    fn init(names: Vec<PlayerName>) -> Self {

        // Transform to HashMap<PlayerName, Rc<RefCell<Player>>>
        let mut players = HashMap::new();
        for name in names.iter() {
            players.insert(
                name.clone(),
                Rc::new(RefCell::new( Player {name: name.clone()}))
            );
        }
        
        PlanetWars {
            players: players,
            planets: gen_planets(names),
            expeditions: Vec::new()
        }
    }

    fn start(&mut self) -> GameStatus {
        let mut pi = PlayerInput::new();
        let state = self.to_state();

        for (name, player) in &self.players {
            let inp = serde_json::to_string(&state).expect("[PLANET_WARS] Serializing game state failed.");
            pi.insert(name.clone(), inp);
        }

        GameStatus::Running(pi)
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        self.step_expeditions();
        self.resolve_combats();
        unimplemented!()
    }
}

impl PlanetWars {
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

pub struct Fleet {
    owner: Weak<RefCell<Player>>,
    ship_count: u64,
}

pub struct Planet {
    name: PlanetName,
    fleets: Vec<Fleet>,
    x: u32,
    y: u32,
}

impl Planet {
    pub fn new(name: PlanetName, fleets: Vec<Fleet>, x: u32, y: u32) -> Planet {
        Planet {
            name: name,
            fleets: fleets,
            x: x,
            y: y
        }
    }
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
    fn from_move(move: Move) -> Expedition {
        unimplemented();
    }
}

impl Expedition {
    fn into_orbit(self) {
        let target_ref = self.target.upgrade().unwrap();
        target_ref.borrow_mut().orbit(self.fleet);
    }
}

struct Player {
    name: PlayerName,
}

impl PartialEq for Player {
    fn eq(&self, other: &Player) -> bool {
        self.name == other.name
    }
}