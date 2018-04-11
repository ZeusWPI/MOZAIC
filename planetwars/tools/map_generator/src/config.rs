use util::{Bound};

const MIN_PLANETS: usize = 4;
const MAX_PLANETS: usize = 10;

const MIN_PLAYERS: usize = 2;
const MAX_PLAYERS: usize = 2;

const LEFT_BOUND: isize = -50;
const RIGHT_BOUND: isize = 50;
const BOT_BOUND: isize = -20;
const TOP_BOUND: isize = 20;

const MAX_START_SHIPS: usize = 15;
const MIN_START_SHIPS: usize = 1;

pub struct Config {
    pub planet_amount: Bound<usize>,
    pub player_amount: Bound<usize>,
    pub horizontal_bound: Bound<isize>,
    pub vertical_bound: Bound<isize>,
    pub start_ships: Bound<usize>
}

impl Config {
    pub fn new() -> Self {
        Config {
            planet_amount: Bound { min: MIN_PLANETS, max: MAX_PLANETS + 1},
            player_amount: Bound { min: MIN_PLAYERS, max: MAX_PLAYERS + 1},
            horizontal_bound: Bound { min: LEFT_BOUND, max: RIGHT_BOUND + 1},
            vertical_bound: Bound { min: BOT_BOUND, max: TOP_BOUND + 1},
            start_ships: Bound { min: MIN_START_SHIPS, max: MAX_START_SHIPS + 1},
        }
    }
}
