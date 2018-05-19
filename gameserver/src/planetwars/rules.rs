/// The planet wars game rules.
pub struct PlanetWars {
    pub players: Vec<Player>,
    pub planets: Vec<Planet>,
    pub expeditions: Vec<Expedition>,
    // How many expeditions were already dispatched.
    // This is needed for assigning expedition identifiers.
    pub expedition_num: u64,
    pub turn_num: u64,
    pub max_turns: u64,
}

#[derive(Debug)]
pub struct Player {
    pub id: usize,
    pub alive: bool,
}

#[derive(Debug)]
pub struct Fleet {
    pub owner: Option<usize>,
    pub ship_count: u64,
}

#[derive(Debug)]
pub struct Planet {
    pub id: usize,
    pub name: String,
    pub fleets: Vec<Fleet>,
    pub x: f64,
    pub y: f64,
}

#[derive(Debug)]
pub struct Expedition {
    pub id: u64,
    pub origin: usize,
    pub target: usize,
    pub fleet: Fleet,
    pub turns_remaining: u64,
}

#[derive(Debug)]
pub struct Dispatch {
    pub origin: usize,
    pub target: usize,
    pub ship_count: u64,
}

impl PlanetWars {

    pub fn dispatch(&mut self, dispatch: Dispatch) {
        let distance = self.planets[dispatch.origin].distance(
            &self.planets[dispatch.target]
        );

        let origin = &mut self.planets[dispatch.origin];
        origin.fleets[0].ship_count -= dispatch.ship_count;


        let expedition = Expedition {
            id: self.expedition_num,
            origin: dispatch.origin,
            target: dispatch.target,
            turns_remaining: distance,
            fleet: Fleet {
                owner: origin.owner(),
                ship_count: dispatch.ship_count,
            },
        };

        // increment counter
        self.expedition_num += 1;
        self.expeditions.push(expedition);
    }

    // Play one step of the game
    pub fn step(&mut self) {
        self.turn_num += 1;

        // Initially mark all players dead, re-marking them as alive once we
        // encounter a sign of life.
        for player in self.players.iter_mut() {
            player.alive = false;
        }

        self.step_expeditions();
        self.resolve_combat();
    }


    pub fn repopulate(&mut self) {
        for planet in self.planets.iter_mut() {
            if planet.owner().is_some() {
                planet.fleets[0].ship_count += 1;
            }
        }
    }

    fn step_expeditions(&mut self) {
        let mut i = 0;
        let exps = &mut self.expeditions;
        while i < exps.len() {
            // compare with 1 to avoid issues with planet distance 0
            if exps[i].turns_remaining <= 1 {
                // remove expedition from expeditions, and add to fleet
                let exp = exps.swap_remove(i);
                let planet = &mut self.planets[exp.target];
                planet.orbit(exp.fleet);
            } else {
                exps[i].turns_remaining -= 1;
                if let Some(owner_id) = exps[i].fleet.owner {
                    // owner has an expedition in progress; this is a sign of life.
                    self.players[owner_id].alive = true;
                }

                // proceed to next expedition
                i += 1;
            }
        }
    }

    fn resolve_combat(&mut self) {
        for planet in self.planets.iter_mut() {
            planet.resolve_combat();
            if let Some(owner_id) = planet.owner() {
                // owner owns a planet; this is a sign of life.
                self.players[owner_id].alive = true;
            }
        }
    }

    pub fn is_finished(&self) -> bool {
        let remaining = self.players.iter().filter(|p| p.alive).count();
        return remaining < 2 || self.turn_num >= self.max_turns;
    }

    pub fn living_players(&self) -> Vec<usize> {
        self.players.iter().filter_map(|p| {
            if p.alive {
                Some(p.id)
            } else {
                None
            }
        }).collect()
    }
}


impl Planet {
    pub fn owner(&self) -> Option<usize> {
        self.fleets.first().and_then(|f| f.owner)
    }

    pub fn ship_count(&self) -> u64 {
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
}