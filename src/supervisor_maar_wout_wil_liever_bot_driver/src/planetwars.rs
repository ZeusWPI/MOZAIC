use std::collections::HashMap;

use std::rc::{Rc, Weak};
use std::cell::RefCell;

use protocol::*;

struct PlanetWars {
    players: HashMap<String, Rc<RefCell<Player>>>,
    planets: HashMap<String, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

struct Planet {
    name: String,
    owner: Option<Weak<RefCell<Player>>>,
    ship_count: u64,
    x: f64,
    y: f64,
}

struct Expedition {
    target: Weak<RefCell<Planet>>,
    owner: Weak<RefCell<Player>>,
    ship_count: u64,
    turns_remaining: u64,
}

struct Player {
    name: String,
}
