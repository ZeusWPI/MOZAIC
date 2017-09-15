extern crate serde_json;

use std::collections::HashMap;
use game::*;
use games::planetwars::protocol;
use games::planetwars::planet_gen::{gen_map};
use logger::Logger;

const START_SHIPS: u64 = 15;

pub struct PlanetWars {
    players: HashMap<PlayerId, Player>,
    planets: HashMap<String, Planet>,
    expeditions: Vec<Expedition>,
    // How many expeditions were already dispatched.
    // This is needed for assigning expedition id's.
    expedition_num: u64,
    log: Logger,
}

struct Player {
    id: PlayerId,
    name: String,
    alive: bool,
}

pub struct Fleet {
    owner: Option<PlayerId>,
    ship_count: u64,
}

pub struct Planet {
    pub name: String,
    pub fleets: Vec<Fleet>,
    pub x: u64,
    pub y: u64,
}

pub struct Expedition {
    id: u64,
    origin: String,
    target: String,
    fleet: Fleet,
    turns_remaining: u64,
}


impl Game for PlanetWars {
    // Name of the game winner.
    type Outcome = String;
    type Config = ();

    fn init(params: MatchParams<Self>) -> (Self, GameStatus<Self>) {
        // Transform to HashMap<PlayerId, Player>
        let mut players = HashMap::new();
        for (&id, info) in params.players.iter() {
            players.insert(id, Player {
                id: id,
                name: info.name.clone(),
                alive: true,
            });
        }

        let mut state = PlanetWars {
            planets: gen_map(players.len()),
            players: players,
            expeditions: Vec::new(),
            expedition_num: 0,
            log: params.logger,
        };

        state.place_players();

        let prompts = state.generate_prompts();
        (state, GameStatus::Prompting(prompts))
    }

    fn step(&mut self, player_output: &PlayerMap<String>) -> GameStatus<Self> {
        // TODO: separate this into a function
        let mut commands : Vec<(PlayerId, protocol::Command)> = Vec::new();

        // Serialize commands
        for (player, command) in player_output {
            let c: protocol::Command = match serde_json::from_str(command) {
                Ok(command) => command,
                // Ignore invalid commands
                Err(_) => protocol::Command { value: None } 
            };
            commands.push((player.clone(), c))
        }

        // Execute commands
        for &(player_id, ref command) in commands.iter() {
            if let &Some(ref mv) = &command.value {
                self.exec_move(player_id, mv);
            }
        }
         
        // Play one step of the game, given the new expeditions
        // Initially mark all players dead, re-marking them as alive once we
        // find a sign of life.
        for player in self.players.values_mut() {
            player.alive = false;
        }

        self.step_expeditions();
        self.step_planets();

        // Log full state
        // TODO: Handle stream error's
        let state = self.repr();
        self.log.log_json(&state).ok();

        // Check for game end, generated next move, or the outcome.
        if self.is_finished() {
            let winner = self.players.values().filter(|p| p.alive).nth(0).unwrap();
            GameStatus::Finished(winner.name.clone())
        } else {
            GameStatus::Prompting(self.generate_prompts())
        }
    }
}

impl PlanetWars {
    fn generate_prompts(&self) -> PlayerMap<String> {
        let mut prompts = HashMap::new();
        let state = self.repr();

        for player in self.players.values() {
            if player.alive {
                let prompt = serde_json::to_string(&state)
                        .expect("[PLANET_WARS] Serializing game state failed.");
                prompts.insert(player.id, prompt);
            }
        }

        prompts
    }

    fn is_finished(&self) -> bool {
        self.players.values().filter(|p| p.alive).count() <= 1
    }

    fn repr(&self) -> protocol::State {
        let planets = self.planets.values().map(|p| p.repr(self)).collect();
        let expeditions = self.expeditions.iter().map(|e| e.repr(self)).collect();
        let players = self.players.values().map(|p| p.name.clone()).collect();
        
        protocol::State { players, expeditions, planets }
    }

    fn exec_move(&mut self, player_id: PlayerId, m: &protocol::Move) {
        // TODO: this code sucks.
        // TODO: actually handle errors
        // MOZAIC should support soft errors first, of course.
        // Alternatively, a game implementation could be made responsible for
        // this. This would require more work, but also allow more flexibility.

        if !self.planets.contains_key(&m.origin) ||
           !self.planets.contains_key(&m.destination) {
            return;
        }

        // calculate distance before mutably borrowing origin
        let dist = self.planets[&m.origin].distance(&self.planets[&m.destination]);
        let origin = self.planets.get_mut(&m.origin).unwrap();
        
        if origin.owner() != Some(player_id) ||
           origin.ship_count() < m.ship_count {
            return;
        }

        let fleet = origin.prepare_fleet(m.ship_count);
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
            exps[i].turns_remaining -= 1;
            if exps[i].turns_remaining == 0 {
                let exp = exps.swap_remove(i);
                let planet = self.planets.get_mut(&exp.target).unwrap();
                planet.orbit(exp.fleet);
            } else {
                if let Some(owner) = exps[i].fleet.owner {
                    // owner has an expedition in progress; this is a sign of life.
                    self.players.get_mut(&owner).unwrap().alive = true;
                }
                // proceed to next expedition
                i += 1;
            }
        }
    }

    fn step_planets(&mut self) {
        for planet in self.planets.values_mut() {
            planet.resolve_combat();
            if let Some(owner) = planet.owner() {
                planet.fleets[0].ship_count += 1;
                // owner owns a planet; this is a sign of life.
                self.players.get_mut(&owner).unwrap().alive = true;
            }
        }
    }

    fn place_players(&mut self) {
        let mut planets = self.planets.values_mut().take(self.players.len());
        for player in self.players.values() {
            let planet = planets.next().expect("Not enough planets");
            planet.fleets.push( Fleet {
                owner: Some(player.id),
                ship_count: START_SHIPS,
            });
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

    fn prepare_fleet(&mut self, size: u64) -> Fleet {
        self.fleets[0].ship_count -= size;
        Fleet {
            owner: self.owner(),
            ship_count: size,
        }
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
            while self.fleets[self.fleets.len()-1].ship_count == 0 {
                self.fleets.pop();
            }
        }
    }

    // Euclidian distance
    fn distance(&self, other: &Planet) -> u64 {
        (((self.x - other.x).pow(2) - (self.y - other.y).pow(2)) as f64).sqrt() as u64
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
