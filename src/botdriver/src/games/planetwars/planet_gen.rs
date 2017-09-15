use rand;
use rand::Rng;

use std::collections::HashMap;

use games::planetwars::planet_wars::Planet;

const WIDTH: u64 = 40;
const HEIGHT: u64 = 25;
const PLANET_FACTOR: u64 = 2;

pub fn gen_map(num_players: usize) -> HashMap<String, Planet> {
    let mut planets = HashMap::new();
    let num_planets = num_players as u64 * PLANET_FACTOR;
    let locations = gen_locations(num_planets as u64);

    for (i, &(x, y)) in locations.iter().enumerate() {
        let planet_name = format!("Planet_{}", i);
        let planet = Planet {
            name: planet_name.to_string(),
            fleets: Vec::new(),
            x: x as f64,
            y: y as f64
        };
        planets.insert(planet_name, planet);
    }

    return planets;
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
