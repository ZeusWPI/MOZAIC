use std::collections::HashMap;
use std::rc::{Rc, Weak};

use protocol::*;

pub struct InitialStateBuilder {
    state: State
}

impl InitialStateBuilder {
    pub fn add_player(&mut self, player: String) {
        self.state.players.push(player);
    }

    pub fn add_planet(&mut self, name: String, x: f64, y: f64, ship_count: u64, owner: Option<String>) {
        self.state.planets.push(Planet {
            ship_count: ship_count,
            x: x,
            y: y,
            owner: owner,
            name: name,
        });
    }
}

struct PlanetWars {
    players: HashMap<String, Rc<Player>>,
    planets: HashMap<String, Rc<Planet>>,
    expeditions: Vec<Expedition>,
}

struct Planet {
    name: String,
    owner: Weak<Player>,
    ship_count: u64,
    x: f64,
    y: f64,
}

struct Expedition {
    target: Weak<Planet>,
    owner: Weak<Player>,
    ship_count: u64,
    turns_remaining: u64,
}

struct Player {
    name: String,
}
