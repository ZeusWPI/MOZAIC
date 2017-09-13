extern crate serde_json;

use std::collections::HashMap;
use game::*;
use games::planetwars::protocol;
use games::planetwars::planet_gen::{gen_map};

const START_SHIPS: u64 = 15;



pub struct Fleet {
    owner: PlayerId,
    ship_count: u64,
}

pub struct Planet {
    pub name: String,
    pub fleets: Vec<Fleet>,
    pub x: u64,
    pub y: u64,
}

impl Planet {
    fn owner(&self) -> Option<PlayerId> {
        self.fleets.first().map(|f| f.owner)
    }
    
    fn ship_count(&self) -> u64 {
        self.fleets.first().map_or(0, |f| f.ship_count)
    }

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
        // destroy some ships
        self.fleets.sort_by(|a, b| a.ship_count.cmp(&b.ship_count).reverse());
        while self.fleets.len() > 1 {
            let fleet = self.fleets.pop().unwrap();
            for other in self.fleets.iter_mut() {
                other.ship_count -= fleet.ship_count;
            }

            // remove dead fleets
            while self.fleets[self.fleets.len()-1].ship_count == 0 {
                self.fleets.pop();
            }
        }
    }

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

struct Expedition {
    origin: String,
    target: String,
    fleet: Fleet,
    turns_remaining: u64,
}

impl Expedition {
    fn repr(&self, pw: &PlanetWars) -> protocol::Expedition {
        protocol::Expedition {
            ship_count: self.fleet.ship_count,
            origin: self.origin.clone(),
            destination: self.target.clone(),
            owner: pw.players[&self.fleet.owner].name.clone(),
            turns_remaining: self.turns_remaining,
        }
    }


}

struct Player {
    id: usize,
    name: String,
    ship_count: u64,
}

impl Player {
    fn is_alive(&self) -> bool {
        self.ship_count > 0
    }
}

 impl PartialEq for Player {
    fn eq(&self, other: &Player) -> bool {
        self.name == other.name
    }
}


pub struct PlanetWars {
    players: HashMap<PlayerId, Player>,
    planets: HashMap<String, Planet>,
    expeditions: Vec<Expedition>,
}


impl PlanetWars {
    fn generate_prompts(&self) -> PlayerMap<String> {
        let mut prompts = HashMap::new();
        let prompt = serde_json::to_string(&self.repr())
            .expect("[PLANET_WARS] Serializing game state failed.");
            

        for player in self.players.values() {
            if player.is_alive() {
                prompts.insert(player.id, prompt.clone());
            }
        }
        return prompts;
    }

    fn is_finished(&self) -> bool {
        self.players.values().filter(|p| p.is_alive()).count() <= 1
    }

    fn repr(&self) -> protocol::State {
        let planets = self.planets.values().map(|p| p.repr(self)).collect();
        let expeditions = self.expeditions.iter().map(|e| e.repr(self)).collect();
        let players = self.players.values().map(|p| p.name.clone()).collect();
        return protocol::State { players, expeditions, planets };
    }

    fn exec_move(&mut self, player_id: PlayerId, m: &protocol::Move) {
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

        // TODO: maybe wrap this in a helper function
        origin.fleets[0].ship_count -= m.ship_count;
        let fleet = Fleet {
            owner: player.id,
            ship_count: m.ship_count,
        };

        let expedition = Expedition {
            origin: origin.name.clone(),
            target: m.destination.clone(),
            fleet: fleet,
            turns_remaining: dist,
        };
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
                i += 1;
            }
        }
    }

    fn resolve_combats(&mut self) {
        for planet in self.planets.values_mut() {
            planet.resolve_combat();
        }
    }

    fn place_players(&mut self) {
        let mut planets = self.planets.values_mut().take(self.players.len());
        for player in self.players.values() {
            let planet = planets.next()
                .expect("Not enough planets");
            planet.fleets.push( Fleet {
                owner: player.id,
                ship_count: START_SHIPS,
            });
        }
    }
}


impl Game for PlanetWars {
    type Outcome = HashMap<String, u64>;
    type Config = ();

    fn init(params: MatchParams<Self>) -> (Self, GameStatus<Self>) {
        // Transform to HashMap<PlayerId, Rc<RefCell<Player>>>
        let mut players = HashMap::new();
        for (&id, info) in params.players.iter() {
            players.insert(id, Player {
                id: id,
                name: info.name.clone(),
                ship_count: START_SHIPS,
            });
        }
        let mut state = PlanetWars {
            planets: gen_map(players.len()),
            players: players,
            expeditions: Vec::new(),

        };

        state.place_players();

        let prompts = state.generate_prompts();
        return (state, GameStatus::Prompting(prompts));
    }

    fn step(&mut self, player_output: &PlayerMap<String>) -> GameStatus<Self> {
        // TODO: separate this into a function
        let mut commands : Vec<(PlayerId, protocol::Command)> = Vec::new();

        // Serialize commands
        for (player, command) in player_output {
            let c: protocol::Command = match serde_json::from_str(command) {
                Ok(command) => command,
                Err(_) => protocol::Command { value: None }
            };
            commands.push((player.clone(), c))
        }

        for &(player_id, ref command) in commands.iter() {
            if let &Some(ref mv) = &command.value {
                self.exec_move(player_id, mv);
            }
        }
         
        // Play one step of the game, given the new expeditions
        self.step_expeditions();
        self.resolve_combats();

        if self.is_finished() {
            //TODO Actually make the outcome
            GameStatus::Finished(HashMap::new())
        } else {
            GameStatus::Prompting(self.generate_prompts())
        }
    }
}
