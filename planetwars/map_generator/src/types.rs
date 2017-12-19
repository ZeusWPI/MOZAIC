use serde_json;

use std;
use std::fmt::{Formatter, Display, Result};

#[allow(dead_code)]
#[derive(Serialize, Deserialize)]
pub struct Map {
    players: Vec<String>,
    planets: Vec<Planet>
}

impl Map {
    pub fn new(players: Vec<String>, planets: Vec<Planet>) -> Self {
        Map {
            players: players,
            planets: planets
        }
    }
}

impl Display for Map {
    fn fmt(&self, f: &mut Formatter) -> Result {
        let value = match serde_json::to_string_pretty(self) {
            Ok(value) => value,
            Err(_) => return Err(std::fmt::Error)
        };
        write!(f, "{}", value)
    }
}

#[derive(Serialize, Deserialize)]
pub struct Planet {
    pub x: f32,
    pub y: f32,
    pub owner: Option<String>,
    pub ship_count: usize,
    pub name: String
}
