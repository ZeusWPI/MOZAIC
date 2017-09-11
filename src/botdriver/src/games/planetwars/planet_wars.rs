extern crate serde_json;

use std::collections::HashMap;
use std::rc::{Rc, Weak};
use std::cell::{RefCell};

use game::*;
use games::planetwars::protocol;
use games::planetwars::planet_gen::{gen_map};

const START_SHIPS: u64 = 15;

pub struct PlanetWars<'g> {
    players: PlayerMap<'g, Rc<RefCell<Player>>>,
    eliminated: Vec<Rc<RefCell<Player>>>,
    planets: HashMap<String, Rc<RefCell<Planet>>>,
    expeditions: Vec<Expedition>,
}

impl<'g> Game<'g> for PlanetWars<'g> {
    type Outcome = Vec<Rc<RefCell<Player>>>;
    type Config = ();

    fn init(config: MatchParams<'g, Self>) -> (Self, GameStatus<'g, Self>) {

        // Transform to HashMap<PlayerId, Rc<RefCell<Player>>>
        let mut players = HashMap::new();
        for name in config.players.iter() {
            players.insert(
                name.clone(),
                Rc::new(RefCell::new( Player { name: name.to_string() }))
            );
        }
        let mut state = PlanetWars {
            planets: gen_map(players.len()),
            players: players,
            eliminated: Vec::new(),
            expeditions: Vec::new(),

        };

        state.place_players();

        let prompts = state.generate_prompts();
        return (state, GameStatus::Prompting(prompts));
    }

    fn step(&mut self, player_output: &PlayerMap<'g, String>) -> GameStatus<'g, Self> {
        let mut commands : Vec<(PlayerId, protocol::Command)> = Vec::new();

        // Serialize commands
        for (player, command) in player_output {
            let c: protocol::Command = match serde_json::from_str(command) {
                Ok(command) => command,
                Err(_) => protocol::Command { value: None }
            };
            commands.push((player.clone(), c))
        }
        
        // Filter empty moves
        let moves = commands.into_iter().filter_map(|(player, command)| {
            command.value.map(|moof| (player, moof))
        });

        // Filter invalid moves
        let moves :Vec<(PlayerId, protocol::Move)> = moves.filter_map(|(player, moof)| {
            self.validate_move(player.clone(), moof).map(|moof| (player, moof))
        }).collect();

        // Add moves as expeditionss
        for (player, moof) in moves {
            let exp = self.exp_from_move(player, moof);
            self.expeditions.push(exp)
        }

        // Play one step of the game, given the new expeditions
        self.step_expeditions();
        self.resolve_combats();

        if self.is_finished() {
            //TODO Actually make the outcome
            // -> Vector with winner first, then losers
            // -> last item is first player to be eliminated
            GameStatus::Finished(Vec::new())
        } else {
            GameStatus::Prompting(self.generate_prompts())
        }
    }
}

impl<'g> PlanetWars<'g> {

    fn validate_move(&mut self, player: PlayerId, m: protocol::Move) -> Option<protocol::Move> {
        // Check whether origin is a valid planet
        let origin = match self.planets.get(&m.origin) {
            Some(planet) => planet,
            None => return None
        };

        // Check whether destination is a valid planet
        let destination = match self.planets.get(&m.destination){
            Some(planet) => planet,
            None => return None
        };

        // Check whether the sender is the owner of origin
        if origin.borrow_mut().owner() != Some(player) {
            return None
        }

        // Check whether the owner has enough ships to send
        if origin.borrow_mut().ship_count() < m.ship_count {
            return None
        }

        Some(m)
    }

    fn generate_prompts(&self) -> PlayerMap<'g, String> {
        let mut prompts = HashMap::new();
        let state = self.to_state();

        for (&name, player) in &self.players {
            if player.borrow().is_alive() {
                let serialized = serde_json::to_string(&state)
                    .expect("[PLANET_WARS] Serializing game state failed.");
                prompts.insert(name, serialized);
            }
        }
        return prompts;
    }

    fn is_finished(&self) -> bool {
        return self.eliminated.len() < self.players.len() - 1;
    }

    fn to_state(&self) -> protocol::State {
let mut players = Vec::new();
        let mut planets = Vec::new();
        let mut expeditions = Vec::new();

        //Fill players vector
        for name in self.players.keys() {
            players.push(name.clone());
        }

        //Fill planets vector
        for mut planet in self.planets.values_mut() {
            let planet_value = Rc::get_mut(&mut planet).unwrap().borrow();

            let planet_clone = protocol::Planet {
                ship_count: planet_value.ship_count(),
                x: planet_value.x as f64,
                y: planet_value.y as f64,
                owner: planet_value.owner(),
                name: planet_value.name.clone(),
            };
            planets.push(planet_clone);
        }

        //Fill expeditions vector
        for expedition in self.expeditions.iter() {
            let expedition_fleet = &expedition.fleet;

            let expedition_clone = protocol::Expedition {
                ship_count: expedition_fleet.ship_count,
                origin: expedition.origin(),
                destination: expedition.target(),
                owner: expedition_fleet.owner().unwrap(),
                turns_remaining: expedition.turns_remaining,
            };
            expeditions.push(expedition_clone);
        }

        protocol::State {
            players: players,
            planets: planets,
            expeditions: expeditions
        }

    }

    fn exp_from_move(&mut self, player_name: PlayerId, m: protocol::Move) -> Expedition {
        let owner = self.players.get(&player_name).unwrap(); // Add error message
        let fleet = Fleet {
            owner: Rc::downgrade(owner),
            ship_count: m.ship_count
        };

        let origin = self.planets.get(&m.origin).unwrap();
        let target = self.planets.get(&m.destination).unwrap(); // Add error message
        Expedition {
            origin: Rc::downgrade(origin),
            target: Rc::downgrade(target),
            fleet: fleet,
            turns_remaining: origin.borrow().distance(&target.borrow())
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
            let mut value : &mut Rc<RefCell<Planet>> = values.next()
                .expect("Not enough planets generated for players.");
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

impl Fleet {
    pub fn owner(&self) -> Option<PlayerId> {
        let player_ref = self.owner.upgrade().unwrap();
        let player_name = player_ref.borrow().name.clone();
        //Some(player_name)
        unimplemented!();
    }
}

pub struct Planet {
    name: String,
    fleets: Vec<Fleet>,
    x: u64,
    y: u64,
}

impl Planet {
    pub fn new(name: protocol::PlanetName, fleets: Vec<Fleet>, x: u64, y: u64) -> Planet {
        Planet {
            name: name,
            fleets: fleets,
            x: x,
            y: y
        }
    }

    pub fn owner(&self) -> Option<PlayerId> {
        if self.fleets.capacity() > 0 {
            let ref fleet = self.fleets[0];
            let owner_name = fleet.owner();
            owner_name
        } else {
            None
        }
    }

    pub fn ship_count(&self) -> u64 {
        if self.fleets.capacity() > 0 {
            let ref fleet = self.fleets[0];
            fleet.ship_count
        } else {
            0
        }
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

    fn distance(&self, other: &Planet) -> u64 {
        (((self.x - other.x).pow(2) - (self.y - other.y).pow(2)) as f64).sqrt() as u64
    }
}

struct Expedition {
    origin: Weak<RefCell<Planet>>,
    target: Weak<RefCell<Planet>>,
    fleet: Fleet,
    turns_remaining: u64,
}

impl Expedition {
    pub fn origin(&self) -> protocol::PlanetName {
        let origin_ref = self.origin.upgrade().unwrap();
        let origin_name = origin_ref.borrow().name.clone();
        origin_name
    }

    pub fn target(&self) -> protocol::PlanetName {
        let target_ref = self.target.upgrade().unwrap();
        let target_name = target_ref.borrow().name.clone();
        target_name
    }

    fn into_orbit(self) {
        let target_ref = self.target.upgrade().unwrap();
        target_ref.borrow_mut().orbit(self.fleet);
    }
}

struct Player {
    name: String,

}

impl Player {
    fn is_alive(&self) -> bool {
        true
    }
}

impl PartialEq for Player {
    fn eq(&self, other: &Player) -> bool {
        self.name == other.name
    }
}
