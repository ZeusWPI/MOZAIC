use protocol::*;

pub struct InitialStateBuilder {
    state: State
}

impl InitialStateBuilder {
    pub fn add_player(&mut self, player: String) {
        self.state.players.push(player);
    }

    pub fn add_planet(&mut self, name: String, x: f64, y: f64, ship_count: u64, owner: Option<String>) {
        self.state.planets.push(Planet {
            ship_count: ship_count,
            x: x,
            y: y,
            owner: owner,
            name: name,
        });
    }
}

struct PlanetWars {
    state: State,
}