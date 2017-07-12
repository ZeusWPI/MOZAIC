mod types;

use types::*;
use std::error::Error;
use std::env;
use std::io;
use std::fs::File;
use std::io::prelude::*;
use std::path::PathBuf;

fn main() {
    let game_config = match parse_config() {
        Ok(config) => config,
        Err(e) => {
            println!("{}", e);
            std::process::exit(1)
        }
    };
    //run::<Stub>();
}

fn parse_config() -> Result<GameConfig, Box<Error>> {
    let args: Vec<_> = env::args().collect();
    if (args.len() < 2) || (args.len() > 2) {
        let msg = format!("Expected 1 argument. {} given.", args.len() - 1).to_owned();
        return Err(From::from(msg))
    }
    
    let mut path = PathBuf::from(&args[1]);
    let mut file = File::open(path)?;

    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    println!("test {}", contents);
    Ok(GameConfig { start_commands: vec![] })
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
                println!("Running with new player input:\n{:?}\n", pi);
                let po = fetch_player_outputs(&pi);
                println!("Received new player output:\n{:?}\n", po);
                gamestate = game.step(&po);
            },
            GameStatus::Done(outcome) => {
                println!("Done with: {:?}", outcome);
                break;
            } 
        }
    }
}

// TODO: This could be prettier i guess
fn fetch_player_outputs(input: &PlayerInput) -> PlayerOutput {
    let mut po = vec![];
    for &(ref player, ref info) in input {
        po.push((player.clone(), fetch_player_output(player, info)))
    }
    po
}

fn fetch_player_output(player: &Player, info: &GameInfo) -> PlayerCommand {
    return match (player.as_ref(), info.as_ref()) {
        ("Ilion", "start") => "eerste zet".to_owned(),
        ("Anna", "betere start") => "betere eerste zet".to_owned(),
        ("Ilion", "slecht nieuws") => "paniek".to_owned(),
        ("Anna", "goed nieuws") => "de doodssteek".to_owned(),
        _ => "een beweging".to_owned()
    }
}

struct Stub;

impl Game for Stub {
    fn init(names: Vec<Player>) -> Self {
        Stub
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