use planetwars::rules::{PlanetWars, Planet, Expedition};
use planetwars::protocol as proto;

pub struct Serializer<'a> {
    state: &'a PlanetWars,
    player_offset: usize,
}

impl<'a> Serializer<'a> {
    pub fn new(state: &'a PlanetWars, player_offset: usize) -> Self {
        Serializer {
            state: state,
            player_offset: player_offset,
        }
    }

    pub fn serialize(&self) -> proto::State {
        proto::State {
            planets: self.state.planets.iter().map(|planet| {
                self.serialize_planet(planet)
            }).collect(),
            expeditions: self.state.expeditions.iter().map(|exp| {
                self.serialize_expedition(exp)
            }).collect(),
        }
    }

    pub fn serialize_player(&self, player_id: usize) -> u64 {
        let num_players = self.state.players.len();
        let rotated_id = (player_id + self.player_offset) % num_players;
        // protocol player ids start at 1
        return (rotated_id + 1) as u64;
    }

    pub fn serialize_planet(&self, planet: &Planet) -> proto::Planet {
        proto::Planet {
            name: planet.name.clone(),
            x: planet.x,
            y: planet.y,
            owner: planet.owner().map(|id| self.serialize_player(id)),
            ship_count: planet.ship_count(),
        }
    }

    pub fn serialize_expedition(&self, exp: &Expedition) -> proto::Expedition {
        proto::Expedition {
            id: exp.id,
            owner: self.serialize_player(exp.fleet.owner.unwrap()),
            ship_count: exp.fleet.ship_count,
            origin: self.state.planets[exp.origin].name.clone(),
            destination: self.state.planets[exp.target].name.clone(),
            turns_remaining: exp.turns_remaining,
        }
    }
}