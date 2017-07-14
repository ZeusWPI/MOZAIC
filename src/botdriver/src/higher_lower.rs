pub struct HigherLower;

use types::*;

impl Game for HigherLower {
    fn init(names: Vec<Player>) -> Self {
        HigherLower
    }

    fn start(&mut self) -> GameStatus {
        GameStatus::Running(vec![
            ("Ilion".to_owned(), "start".to_owned()),
            ("Anna".to_owned(), "betere start".to_owned())
        ])
    }

    fn step(&mut self, player_output: &PlayerOutput) -> GameStatus {
        let mut pi = vec![];
        for &(ref player, ref command) in player_output {
            match (player.as_ref(), command.as_ref()) {
                ("Ilion", "eerste zet") => pi.push(("Ilion".to_owned(), "slecht nieuws".to_owned())),
                ("Anna", "betere eerste zet") => pi.push(("Anna".to_owned(), "goed nieuws".to_owned())),
                _ => return GameStatus::Done(Outcome::Score(vec![("Anna".to_owned(), 45), ("Ilion".to_owned(), 0)]))
            }
        }
        GameStatus::Running(pi)
    }
}