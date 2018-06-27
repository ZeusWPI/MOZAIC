use super::pw_rules::{PlanetWars, Planet, Expedition};
use super::pw_protocol as proto;

/// Serialize given gamestate
pub fn serialize_state(state: &PlanetWars) -> proto::State {
    let serializer = Serializer::new(state);
    serializer.serialize_state()
}

struct Serializer<'a> {
    state: &'a PlanetWars,
}

impl<'a> Serializer<'a> {
    fn new(state: &'a PlanetWars) -> Self {
        Serializer {
            state: state,
        }
    }

    fn serialize_state(&self) -> proto::State {
        proto::State {
            planets: self.state
                .planets
                .iter()
                .map(|planet| self.serialize_planet(planet))
                .collect(),
            expeditions: self.state
                .expeditions
                .iter()
                .map(|exp| self.serialize_expedition(exp))
                .collect(),
        }
    }

    // gets the client id for a player number
    fn player_client_id(&self, player_num: usize) -> u32 {
        self.state.players[player_num].id.as_u32()
    }

    fn serialize_planet(&self, planet: &Planet) -> proto::Planet {
        proto::Planet {
            name: planet.name.clone(),
            x: planet.x,
            y: planet.y,
            owner: planet.owner().map(|num| self.player_client_id(num)),
            ship_count: planet.ship_count(),
        }
    }

    fn serialize_expedition(&self, exp: &Expedition) -> proto::Expedition {
        proto::Expedition {
            id: exp.id,
            owner: self.player_client_id(exp.fleet.owner.unwrap()),
            ship_count: exp.fleet.ship_count,
            origin: self.state.planets[exp.origin].name.clone(),
            destination: self.state.planets[exp.target].name.clone(),
            turns_remaining: exp.turns_remaining,
        }
    }
}
