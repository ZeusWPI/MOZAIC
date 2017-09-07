extern crate serde_json;

use std::collections::HashMap;
use std::rc::{Rc, Weak};
use std::cell::{RefCell, RefMut};

use game_types::*;
use game_types::Player as PlayerName;
use games::planetwars::protocol::*;
use games::planetwars::planet_gen::{gen_map};

const START_SHIPS: u64 = 15;

pub struct PlanetWars {
    players: HashMap<PlayerName, Rc<RefCell<Player>>>,
    planets: HashMap<PlanetName, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

impl Game for PlanetWars {
    fn init(names: Vec<PlayerName>) -> Self {

        // Transform to HashMap<PlayerName, Rc<RefCell<Player>>>
        let mut players = HashMap::new();
        for name in names.iter() {
            players.insert(
                name.clone(),
                Rc::new(RefCell::new( Player {name: name.clone()}))
            );
        }

        PlanetWars {
            players: players,
            planets: gen_map(names).planets,
            expeditions: Vec::new()
        }
    }

    fn start(&mut self) -> GameStatus {
        self.place_players();

        let mut pi = PlayerInput::new();
        let state = self.to_state();

        for (name, player) in &self.players {
            let inp = serde_json::to_string(&state).expect("[PLANET_WARS] Serializing game state failed.");
            pi.insert(name.clone(), inp);
        }

        GameStatus::Running(pi)
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        // Player output deserialisering
        // Commando valideren
        // Verwerk commando's
        // Check game gedaan
        // Serialiseren (nieuwe playerinput, ofte gameover)
        // Teruggeven

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

            let moof = match c.value {
                Some(moof) => moof,
                None => continue // No move by player, skip
            };

            let moof = match self.validate_move(moof) {
                Ok(moof) => moof,
                Err(outcome) => return GameStatus::Done(outcome)
            };

            let exp = self.exp_from_move(player.clone(), moof);
            // Add expedition to planet
        }

        self.step_expeditions();
        self.resolve_combats();
        // TODO: Check for game, end, return playeroutput
        GameStatus::Done(Outcome::Score(Scoring::new()))
    }
}

impl PlanetWars {
    fn validate_move(&mut self, m: Move) -> Result<Move, Outcome>{

        // Check whether origin is a valid planet
        let origin = match self.planets.get(&m.origin) {
            Some(planet) => planet,
            None => return Err(faulty_command("Origin is not a valid planet"))
        };

        // Check whether destination is a valid planet
        let destination = match self.planets.get(&m.destination){
            Some(planet) => planet,
            None => return Err(faulty_command("Destination is not a valid planet"))
        };

        if  origin.owner() != *player {
            return faulty_command("You don't own this planet")
        }
        /*

        // Check whether dest is a valid planet
        let dest = match self.planets.get(&c.destination) {
            Some(planet) => planet,
            None => return faulty_command("Destination is not a valid planet")
        };


        if or.ship_count < c.ship_count {
            return faulty_command("You don't control enough ships to send this amount")
        }*/
        Ok(m)
    }

    fn to_state(&mut self) -> State {
        let players = Vec::new();
        let planets = Vec::new();
        let expeditions = Vec::new();
        // TODO
        State {
            players: players,
            planets: planets,
            expeditions: expeditions
        }

    }

    fn exp_from_move(&mut self, player_name: PlayerName, m: Move) -> Expedition {
        let owner = self.players.get(&player_name).unwrap(); // Add error message
        let fleet = Fleet {
            owner: Rc::downgrade(owner), 
            ship_count: m.ship_count
        };

        let target = self.planets.get(&m.destination).unwrap(); // Add error message
        Expedition {
            target: Rc::downgrade(target), 
            fleet: fleet,
            turns_remaining: 5
        }
    }

    fn step_expeditions(&mut self) {
        let mut i = 0;
        let exps = &mut self.expeditions;
        while i < exps.len() {
            exps[i].turns_remaining -= 1;
            if exps[i].turns_remaining == 0 {
                exps.swap_remove(i).into_orbit();
            } else {
                i += 1;
            }
        }
    }

    fn resolve_combats(&mut self) {
        for planet in self.planets.values() {
            planet.borrow_mut().resolve_combat();
        }
    }

    fn place_players(&mut self) {
        let mut values = self.planets.values_mut().take(self.players.len());
        for (player_name, player) in &self.players {
            let mut value : &mut Rc<RefCell<Planet>> = values.next().expect("Not enough planets generated for players.");
            let mut value = Rc::get_mut(value).unwrap().borrow_mut();
            value.fleets.push( Fleet {
                owner: Rc::downgrade(&player),
                ship_count: START_SHIPS
            });
        }
    }
}

pub struct Fleet {
    owner: Weak<RefCell<Player>>,
    ship_count: u64,
}

pub struct Planet {
    name: PlanetName,
    fleets: Vec<Fleet>,
    x: u64,
    y: u64,
}

impl Planet {
    pub fn new(name: PlanetName, fleets: Vec<Fleet>, x: u64, y: u64) -> Planet {
        Planet {
            name: name,
            fleets: fleets,
            x: x,
            y: y
        }
    }

    pub fn owner(&mut self) -> Option<Weak<RefCell<PlayerName>>> {
        self.fleets.get(0)
                   .map(|fleet| fleet.owner)
                   .map(|player| player.name)
    }

    fn orbit(&mut self, fleet: Fleet) {
        // TODO: deduplication (merge fleets from same player)
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
}

struct Expedition {
    target: Weak<RefCell<Planet>>,
    fleet: Fleet,
    turns_remaining: u64,
}

impl Expedition {
    fn into_orbit(self) {
        let target_ref = self.target.upgrade().unwrap();
        target_ref.borrow_mut().orbit(self.fleet);
    }
}

struct Player {
    name: PlayerName,
}

impl PartialEq for Player {
    fn eq(&self, other: &Player) -> bool {
        self.name == other.name
    }
}

fn faulty_command(err: &str) -> Outcome {
    Outcome::Error(err.to_string())
}
