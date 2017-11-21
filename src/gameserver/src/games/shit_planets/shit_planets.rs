// TODO Remove this code, or remove this
#![allow(dead_code)]
#![warn(unused_variables)]

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

#[derive(Serialize, Deserialize)]
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
        for (player, command) in player_output {

            // Parse command
            let c: Command = match serde_json::from_str(command) {
                Ok(command) => command,
                // TODO: More expressive error
                Err(err) => {
                    let msg = format!("Invalid formatted command.\n{}", err);
                    return GameStatus::Done(Outcome::Error(msg.to_owned()));
                } 
            };

            // Check whether origin is a valid planet
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
            }
            
            let exp = Expedition {
                ship_count: c.ship_count,
                origin: c.origin.clone(),
                destination: c.destination.clone(),
                owner: player.clone(),
                turns_remaining: distance(&c.origin, &c.destination)
            };
           
        }
        GameStatus::Done(Outcome::Score(Scoring::new()))
    }
}

fn faulty_command(err: &str) -> GameStatus {
    GameStatus::Done(Outcome::Error(err.to_string()))
}

fn distance(origin: &String, destination: &String) -> u32 {
    // TODO: Fix
    return 5;
}

// TODO: Fix possible planets on same location
fn gen_planets(players: Vec<Player>) -> HashMap<Name, Planet> {
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

fn gen_planet(planet_name: Name, owner: Player) -> Planet {
    let x = rand::thread_rng().gen_range(0, WIDTH);
    let y = rand::thread_rng().gen_range(0, HEIGHT);
    Planet {
        x: x,
        y: y,
        ship_count: START_SHIPS,
        owner: owner,
        name: planet_name.to_string()
    }
}