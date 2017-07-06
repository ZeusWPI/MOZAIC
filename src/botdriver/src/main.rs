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
        println!("\nNew step:\n==============");
        match gamestate {
            GameStatus::Running(pi) => {
                println!("Running with new player input: {:?}", pi);
                let po = fetch_player_output(&pi);
                println!("Received new player output: {:?}", po);
                gamestate = game.step(po);
            },
            GameStatus::Done(outcome) => {
                println!("Done with: {:?}", outcome);
                break;
            } 
        }
    }
}

fn fetch_player_output(input: &PlayerInput) -> PlayerOutput {
    "een beweging".to_owned()
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