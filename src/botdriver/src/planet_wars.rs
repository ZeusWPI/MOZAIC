extern crate serde_json;

use rand;
use rand::Rng;
use std::collections::HashMap;

use game_types::{Game, GameStatus, Player, PlayerInput, PlayerOutput, Outcome, Scoring};

pub struct PlanetWars {
    planets: HashMap<Name, Planet>,
    players: Vec<Player>,
    expeditions: Vec<Expedition>
}

type Name = String;

#[derive(Clone, Serialize, Deserialize)]
struct State {
    players: Vec<Player>,
    planets: Vec<Planet>,
    expeditions: Vec<Expedition>
}

#[derive(Clone, Serialize, Deserialize)]
struct Planet {
    x: u32,
    y: u32,
    ship_count: u32,
    owner: Player,
    name: Name
}

#[derive(Clone, Serialize, Deserialize)]
struct Expedition {
    ship_count: u32,
    origin: Name,
    destination: Name,
    owner: Player,
    turns_remaining: u32
}

struct Command {
    origin: Name,
    destination: Name,
    ship_count: u32
}

const WIDTH: u32 = 40;
const HEIGHT: u32 = 25;
const START_SHIPS: u32 = 15;
const PLANET_FACTOR: u32 = 2;

impl Game for PlanetWars {
    fn init(names: Vec<Player>) -> Self {
        PlanetWars {
            expeditions: Vec::new(),
            players: names.clone(),
            planets: gen_planets(names)
        }
    }

    fn start(&mut self) -> GameStatus {
        let mut pi = PlayerInput::new();
        let state = State {
            players: self.players.clone(),
            expeditions: Vec::new(),
            planets: self.planets.values().cloned().collect()
        };

        for player in &self.players {
            let inp = serde_json::to_string(&state).expect("[PLANET_WARS] Serializing game state failed.");
            pi.insert(player.clone(), inp);
        }
        GameStatus::Running(pi)
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        // TODO
        GameStatus::Done(Outcome::Score(Scoring::new()))
    }
}

// TODO: Fix possible planets on same location
fn gen_planets(players: Vec<Player>) -> HashMap<Name, Planet> {
    let mut planets = HashMap::new();

    for player in &players {
        let planet = gen_player_planet(player);
        planets.insert(planet.name.clone(), planet);
    }

    let player_amount = players.len() as u32;
    let planet_amount = player_amount * PLANET_FACTOR;
    for x in 0..(planet_amount - player_amount) {
        let planet = gen_empty_planet();
        planets.insert(planet.name.clone(), planet);
    }
    
    planets
}

fn gen_player_planet(player: &Player) -> Planet {
    let x = rand::thread_rng().gen_range(0, WIDTH);
    let y = rand::thread_rng().gen_range(0, HEIGHT);
    let pname = format!("{}_Base", player);

    Planet {
        x: x,
        y: y,
        ship_count: START_SHIPS,
        owner: player.to_string(),
        name: pname
    }
}

// TODO: Remove duplication
fn gen_empty_planet() -> Planet {
    let x = rand::thread_rng().gen_range(0, WIDTH);
    let y = rand::thread_rng().gen_range(0, HEIGHT);
    let pname = format!("Planet_{}", x);

    Planet {
        x: x,
        y: y,
        ship_count: 0,
        owner: "".to_string(),
        name: pname
    }
}