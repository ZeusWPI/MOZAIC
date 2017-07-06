mod types;

use types::*;

fn main() {
    run::<Stub>();
}

fn run<G: Game>() {
    /* generate initial game
     * While (not finnished) do 
        for each player
            send gamestate to player
            receive new commands
        generate new gamestate
     */
    let mut game = G::init(vec!["Ilion".to_owned()]);
    let mut gamestate = game.start();
    loop {
        match &mut gamestate {
            ref Running => {
                // gamestate = game.step("Stapstap".to_owned());
                println!("Running")
            },
            ref Done => {
                println!("Done")
            } 
        }
    }
}

struct Stub;

impl Game for Stub {
    fn init(names: Vec<String>) -> Self {
        Stub
    }

    fn start(&mut self) -> GameStatus {
        GameStatus::Running(vec![("Ilion".to_owned(), "Beweeg!".to_owned())])
    }

    fn step(&mut self, player_output: PlayerOutput) -> GameStatus {
        GameStatus::Done(Outcome::Score)
    }
}