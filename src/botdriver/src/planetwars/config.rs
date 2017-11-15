use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::io;

use serde_json;

use planetwars::protocol;
use planetwars::rules::*;


#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub map_file: String,
    pub player_map: HashMap<String, String>,
    pub max_turns: u64,
}

impl Config {
    pub fn create_game(&self, players: HashMap<usize, Player>) -> PlanetWars {
        // construct planet map
        let planets = self.load_map(&players).into_iter()
            .map(|planet| {
                (planet.name.clone(), planet)
            }).collect();

        PlanetWars {
            planets: planets,
            players: players,
            expeditions: Vec::new(),
            expedition_num: 0,
            turn_num: 0,
            max_turns: self.max_turns,
        }
    }
    
    fn load_map(&self, players: &HashMap<usize, Player>) -> Vec<Planet> {
        let map = self.read_map().expect("[PLANET_WARS] reading map failed");
        
        let player_translation: HashMap<&str, usize> = players.iter()
            .map(|(&id, player)| {
                (self.player_map.get(&player.name).unwrap().as_str(), id)
            }).collect();

        return map.planets.into_iter().map(|planet| {
            let mut fleets = Vec::new();
            if planet.ship_count > 0 {
                fleets.push(Fleet {
                    owner: planet.owner.and_then(|ref owner| {
                        player_translation.get(owner.as_str()).map(|&v| v)
                    }),
                    ship_count: planet.ship_count,
                });
            }
            return Planet {
                name: planet.name,
                x: planet.x,
                y: planet.y,
                fleets: fleets,
            };
        }).collect();
    }

    fn read_map(&self) -> io::Result<protocol::Map> {
        let mut file = File::open(&self.map_file)?;
        let mut buf = String::new();
        file.read_to_string(&mut buf)?;
        let map = serde_json::from_str(&buf)?;
        return Ok(map);
    }
}
