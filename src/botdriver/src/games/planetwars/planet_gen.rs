use rand;
use rand::Rng;

use std::collections::HashMap;
use std::rc::{Rc};
use std::cell::{RefCell};

use games::planetwars::planet_wars::Planet;
use game_types::Player as PlayerName;
use games::planetwars::protocol::PlanetName;

const WIDTH: u64 = 40;
const HEIGHT: u64 = 25;
const START_SHIPS: u64 = 15;
const PLANET_FACTOR: u64 = 2;

pub fn gen_planets(players: Vec<PlayerName>) -> HashMap<PlanetName, Rc<RefCell<Planet>>> {
    let mut planets = HashMap::new();
    let player_amount = players.len() as u64;
    let planet_amount = player_amount * PLANET_FACTOR;
    let locations = gen_locations(planet_amount);

    for (x, y) in locations {
        let planet_name = format!("Planet_{}", x);
        let planet = Planet::new(
            planet_name.to_string(),
            Vec::new(),
            x,
            y
        );
        let planet = Rc::new(RefCell::new(planet));
        planets.insert(planet_name, planet);
    }
    planets
}

// We do this so we can prevent planets being generated on the same location
pub fn gen_locations(amount: u64) -> Vec<(u64, u64)> {
    let mut v = (0..amount).map(|_| {
        let x = rand::thread_rng().gen_range(0, WIDTH);
        let y = rand::thread_rng().gen_range(0, HEIGHT);
        (x, y)
    }).collect::<Vec<(u64, u64)>>();
    v.dedup();
    v
}