use rand;
use rand::Rng;

use std::collections::HashMap;

use games::planetwars::planet_wars::Planet;
use game_types::Player as PlayerName;
use games::planetwars::protocol::PlanetName;

const WIDTH: u32 = 40;
const HEIGHT: u32 = 25;
const START_SHIPS: u32 = 15;
const PLANET_FACTOR: u32 = 2;

// TODO: Fix possible planets on same location
pub fn gen_planets(players: Vec<PlayerName>) -> HashMap<PlanetName, Planet> {
    let mut planets = HashMap::new();

    for player in &players {
        let planet_name = format!("{}_Base", player);
        let planet = gen_planet(planet_name, player.clone());
        planets.insert(planet.name.clone(), planet);
    }

    let player_amount = players.len() as u32;
    let planet_amount = player_amount * PLANET_FACTOR;
    for x in 0..(planet_amount - player_amount) {
        let planet_name = format!("Planet_{}", x);
        let planet = gen_planet(planet_name, "".to_string());
        planets.insert(planet.name.clone(), planet);
    }
    
    planets
}

fn gen_planet(planet_name: PlanetName, owner: PlayerName) -> Planet {
    let x = rand::thread_rng().gen_range(0, WIDTH);
    let y = rand::thread_rng().gen_range(0, HEIGHT);
    Planet {
        x: x,
        y: y,
        fleets: Vec::new(),
        name: planet_name.to_string()
    }
}