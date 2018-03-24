use itertools::multizip;
use rand::{thread_rng, sample};

use types::{Map, Planet};
use config::Config;

// TODO: Check invalid configs
pub fn create_map(config: &Config) -> Map {
    let num_players = config.player_amount.rand();
    let num_planets = config.planet_amount.rand();

    let horiz_space = config.horizontal_bound.range();
    let verti_space = config.vertical_bound.range();
    let eucli_space = iproduct!(horiz_space, verti_space);
    let planet_locs = sample(&mut thread_rng(), eucli_space, num_planets);

    let ship_counts = config.start_ships.sample(num_planets);

    let player_locs = sample(&mut thread_rng(), 0..num_planets, num_players);
    let player_names = (0..num_players).map(|i| format!("Player_{}", i + 1));
    let mut planet_owners = vec![None; planet_locs.len()];
    player_locs.iter().enumerate().for_each(|(i, player)| {
        planet_owners[i] = Some(format!("Player_{}", player))
    });

    let planet_names = (0..num_planets).map(|i| format!("Planet_{}", i));
    let planet_tuples = multizip((planet_locs, ship_counts, planet_owners, planet_names));
    let planets = planet_tuples.map(|((x, y), ship_count, owner, name)| {
        Planet {
            x: x as f32,
            y: y as f32,
            ship_count: ship_count,
            owner: owner,
            name: name
        }
    });

    Map::new(player_names.collect(), planets.collect())
}


// Mostly for getting rid of warnings
#[cfg(test)]
mod test {
    use super::create_map;
    use super::Config;

    #[test]
    fn creates_from_default() {
        create_map(&Config::new());
    }
}