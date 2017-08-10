use game_types::{Game, GameStatus, Player, PlayerInput, PlayerOutput, Outcome, Scoring};

pub struct PlanetWars;

impl Game for PlanetWars {
    fn init(names: Vec<Player>) -> Self {
        PlanetWars
    }

    fn start(&mut self) -> GameStatus {
        GameStatus::Done(Outcome::Score(Scoring::new()))
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        GameStatus::Done(Outcome::Score(Scoring::new()))
    }
}