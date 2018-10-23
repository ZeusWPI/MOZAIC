use std::fs::File;
use std::io::Read;
use std::io;

use serde_json;

use super::pw_protocol as proto;
use super::pw_rules::*;

// TODO
use server::ClientId;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub map_file: String,
    pub max_turns: u64,
}

impl Config {
    pub fn create_game(&self, clients: Vec<ClientId>) -> PlanetWars {
        let planets = self.load_map(clients.len());
        let players = clients.into_iter()
            .map(|client_id| Player { id: client_id, alive: true })
            .collect();
        
        PlanetWars {
            players: players,
            planets: planets,
            expeditions: Vec::new(),
            expedition_num: 0,
            turn_num: 0,
            max_turns: self.max_turns,
        }
    }
    
    fn load_map(&self, num_players: usize) -> Vec<Planet> {
        let map = self.read_map().expect("[PLANET_WARS] reading map failed");
        
        return map.planets
            .into_iter()
            .enumerate()
            .map(|(num, planet)| {
            let mut fleets = Vec::new();
                let owner = planet.owner.and_then(|owner_num| {
                    // in the current map format, player numbers start at 1.
                    // TODO: we might want to change this.
                    let player_num = owner_num as usize - 1;
                    // ignore players that are not in the game
                    if player_num < num_players {
                        Some(player_num)
                    } else { 
                        None
                    }
                });
            if planet.ship_count > 0 {
                fleets.push(Fleet {
                    owner: owner,
                    ship_count: planet.ship_count,
                });
            }
            return Planet {
                id: num,
                name: planet.name,
                x: planet.x,
                y: planet.y,
                fleets: fleets,
            };
        }).collect();
    }

    fn read_map(&self) -> io::Result<proto::Map> {
        let mut file = File::open(&self.map_file)?;
        let mut buf = String::new();
        file.read_to_string(&mut buf)?;
        let map = serde_json::from_str(&buf)?;
        return Ok(map);
    }
}
