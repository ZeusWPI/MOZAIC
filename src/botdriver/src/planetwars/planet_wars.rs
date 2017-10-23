extern crate serde_json;

use std::collections::HashMap;
use game::*;
use planetwars::protocol;
use logger::Logger;

use std::io;
use std::io::Read;
use std::fs::File;

#[derive(Debug)]
pub struct PlanetWars {
    players: HashMap<PlayerId, Player>,
    planets: HashMap<String, Planet>,
    expeditions: Vec<Expedition>,
    // How many expeditions were already dispatchd.
    // This is needed for assigning expedition identifiers.
    expedition_num: u64,
    turn_num: u64,
    max_turns: u64,
    log: Logger,
}

#[derive(Debug)]
struct Player {
    id: PlayerId,
    name: String,
    alive: bool,
}

#[derive(Debug)]
pub struct Fleet {
    owner: Option<PlayerId>,
    ship_count: u64,
}

#[derive(Debug)]
pub struct Planet {
    pub name: String,
    pub fleets: Vec<Fleet>,
    pub x: f64,
    pub y: f64,
}

#[derive(Debug)]
pub struct Expedition {
    id: u64,
    origin: String,
    target: String,
    fleet: Fleet,
    turns_remaining: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlanetWarsConf {
    pub map_file: String,
    pub player_map: HashMap<String, String>,
    pub max_turns: u64,
}


impl Game for PlanetWars {
    // Name of the game winner.
    type Outcome = Vec<String>;
    type Config = PlanetWarsConf;

    fn init(params: MatchParams<Self>) -> (Self, GameStatus<Self>) {
        let players : PlayerMap<Player> = params.players.iter()
            .map(|(&id, info)| {
                let player = Player {
                    id: id,
                    name: info.name.clone(),
                    alive: true,
                };
                return (id, player);
            }).collect();

        let planets = params.game_config.load_map(&players).into_iter()
            .map(|planet| {
                (planet.name.clone(), planet)
            }).collect();
        
        let mut state = PlanetWars {
            planets: planets,
            players: players,
            expeditions: Vec::new(),
            expedition_num: 0,
            turn_num: 0,
            max_turns: params.game_config.max_turns,
            log: params.logger,
        };

        state.log_state();
        let prompts = state.generate_prompts();
        return (state, GameStatus::Prompting(prompts));
    }

    fn step(&mut self, player_output: &PlayerMap<String>) -> GameStatus<Self> {
        self.turn_num += 1;

        self.execute_commands(player_output);
         
        // Play one step of the game, given the new expeditions
        // Initially mark all players dead, re-marking them as alive once we
        // find a sign of life.
        for player in self.players.values_mut() {
            player.alive = false;
        }
        self.repopulate();
        self.step_expeditions();
        self.resolve_combat();

        self.log_state();

        if self.is_finished() {
            let alive = self.players.values().filter_map(|p| {
                if p.alive {
                    Some(p.name.clone())
                } else {
                    None
                }
            }).collect();
            GameStatus::Finished(alive)
        } else {
            GameStatus::Prompting(self.generate_prompts())
        }
    }
}

impl PlanetWars {
    fn execute_commands(&mut self, player_output: &PlayerMap<String>) {
        for (&player_id, command) in player_output.iter() {
            let r = serde_json::from_str::<protocol::Command>(command);
            if let Ok(cmd) = r {
                for mv in cmd.moves.iter() {
                    self.exec_move(player_id, mv);
                }
            }
        }
    }
    
    fn generate_prompts(&self) -> PlayerMap<String> {
        let mut prompts = HashMap::new();
        let state = self.repr();

        for player in self.players.values() {
            if player.alive {
                let p = serde_json::to_string(&state)
                        .expect("[PLANET_WARS] Serializing game state failed.");
                prompts.insert(player.id, p);
                               
            }
        }
        return prompts;
    }

    fn log_state(&mut self) {
        let state = self.repr();
        self.log.log_json(&state)
            .expect("[PLANET_WARS] logging failed");
    }

    fn is_finished(&self) -> bool {
        let remaining = self.players.values().filter(|p| p.alive).count();
        return remaining < 2 || self.turn_num >= self.max_turns;
    }

    fn repr(&self) -> protocol::State {
        let planets = self.planets.values().map(|p| p.repr(self)).collect();
        let expeditions = self.expeditions.iter().map(|e| e.repr(self)).collect();
        let players = self.players.values().map(|p| p.name.clone()).collect();
        return protocol::State { players, expeditions, planets };
    }

    fn exec_move(&mut self, player_id: PlayerId, m: &protocol::Move) {
        // TODO: this code sucks.
        // TODO: actually handle errors
        // MOZAIC should support soft errors first, of course.
        // Alternatively, a game implementation could be made responsible for
        // this. This would require more work, but also allow more flexibility.

        let player = self.players.get(&player_id).unwrap();
        if !self.planets.contains_key(&m.origin) {
            return;
        }
        if !self.planets.contains_key(&m.destination) {
            return;
        }

        // calculate distance before mutably borrowing origin
        let dist = self.planets[&m.origin].distance(&self.planets[&m.destination]);
        let origin = self.planets.get_mut(&m.origin).unwrap();
        
        if origin.owner() != Some(player_id) {
            return;
        }
        if origin.ship_count() < m.ship_count {
            return;
        }
        if m.ship_count == 0 {
            return;
        }

        // TODO: maybe wrap this in a helper function
        origin.fleets[0].ship_count -= m.ship_count;
        let fleet = Fleet {
            owner: Some(player.id),
            ship_count: m.ship_count,
        };

        let expedition = Expedition {
            id: self.expedition_num,
            origin: origin.name.clone(),
            target: m.destination.clone(),
            fleet: fleet,
            turns_remaining: dist,
        };
        self.expedition_num += 1;
        self.expeditions.push(expedition);
    }

    fn step_expeditions(&mut self) {
        let mut i = 0;
        let exps = &mut self.expeditions;
        while i < exps.len() {
            // compare with 1 to avoid issues with planet distance 0
            if exps[i].turns_remaining <= 1 {
                // remove expedition from expeditions, and add to fleet
                let exp = exps.swap_remove(i);
                let planet = self.planets.get_mut(&exp.target).unwrap();
                planet.orbit(exp.fleet);
            } else {
                exps[i].turns_remaining -= 1;
                if let Some(owner) = exps[i].fleet.owner {
                    // owner has an expedition in progress; this is a sign of life.
                    self.players.get_mut(&owner).unwrap().alive = true;
                }
                
                // proceed to next expedition
                i += 1;
            }
        }
    }

    fn repopulate(&mut self) {
        for planet in self.planets.values_mut() {
            if planet.owner().is_some() {
                planet.fleets[0].ship_count += 1;
            }
        }
    }

    fn resolve_combat(&mut self) {
        for planet in self.planets.values_mut() {
            planet.resolve_combat();
            if let Some(owner) = planet.owner() {
                // owner owns a planet; this is a sign of life.
                self.players.get_mut(&owner).unwrap().alive = true;
            }
        }
    }
}


impl Planet {
    fn owner(&self) -> Option<PlayerId> {
        self.fleets.first().and_then(|f| f.owner)
    }
    
    fn ship_count(&self) -> u64 {
        self.fleets.first().map_or(0, |f| f.ship_count)
    }

    /// Make a fleet orbit this planet.
    fn orbit(&mut self, fleet: Fleet) {
        // If owner already has a fleet present, merge
        for other in self.fleets.iter_mut() {
            if other.owner == fleet.owner {
                other.ship_count += fleet.ship_count;
                return;
            }
        }
        // else, add fleet to fleets list
        self.fleets.push(fleet);
    }

    fn resolve_combat(&mut self) {
        // The player owning the largest fleet present will win the combat.
        // Here, we resolve how many ships he will have left.
        // note: in the current implementation, we could resolve by doing
        // winner.ship_count -= second_largest.ship_count, but this does not
        // allow for simple customizations (such as changing combat balance).
        
        self.fleets.sort_by(|a, b| a.ship_count.cmp(&b.ship_count).reverse());
        while self.fleets.len() > 1 {
            let fleet = self.fleets.pop().unwrap();
            // destroy some ships
            for other in self.fleets.iter_mut() {
                other.ship_count -= fleet.ship_count;
            }

            // remove dead fleets
            while self.fleets.last().map(|f| f.ship_count) == Some(0) {
                self.fleets.pop();
            }
        }
    }

    fn distance(&self, other: &Planet) -> u64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        return (dx.powi(2) + dy.powi(2)).sqrt().ceil() as u64;
    }

    fn repr(&self, pw: &PlanetWars) -> protocol::Planet {
        protocol::Planet {
            name: self.name.clone(),
            ship_count: self.ship_count(),
            x: self.x as f64,
            y: self.y as f64,
            owner: self.owner().map(|id| pw.players[&id].name.clone())
        }
    }
}

impl Expedition {
    fn repr(&self, pw: &PlanetWars) -> protocol::Expedition {
        protocol::Expedition {
            id: self.id,
            origin: self.origin.clone(),
            destination: self.target.clone(),
            // We can unwrap here, because the protocol currently does not allow
            // for expeditions without an owner.
            owner: pw.players[&self.fleet.owner.unwrap()].name.clone(),
            ship_count: self.fleet.ship_count,
            turns_remaining: self.turns_remaining,
        }
    }
}

impl PlanetWarsConf {
    fn load_map(&self, players: &PlayerMap<Player>) -> Vec<Planet> {
        let map = self.read_map().expect("[PLANET_WARS] reading map failed");
        
        let player_translation: HashMap<&str, PlayerId> = players.iter()
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
