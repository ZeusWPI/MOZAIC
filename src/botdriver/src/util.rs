use serde_json;

use std::error::Error;
use std::path::PathBuf;
use std::collections::HashMap;
use std::env;
use std::fs::File;
use std::io::Read;
use std::process::{Command, Stdio};

use driver_types::{GameConfig, GameConfigFormat, BotHandles};

pub fn parse_config() -> Result<GameConfig, Box<Error>> {
    let args: Vec<_> = env::args().collect();
    if (args.len() < 2) || (args.len() > 2) {
        let msg = format!("Expected 1 argument (config file). {} given.", args.len() - 1).to_owned();
        return Err(From::from(msg))
    }
    
    println!("Opening config {}", &args[1]);
    let path = PathBuf::from(&args[1]);
    let mut file = File::open(path)?;

    println!("Reading contents");
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    
    println!("Parsing config");
    let gcf: GameConfigFormat = serde_json::from_str(&contents)?;
    let mut gc: GameConfig = GameConfig { players: HashMap::new() };
    
    // Move into easier to use struct
    // Check for uniqueness of names
    for pconfig in gcf.players {
        if gc.players.contains_key(&pconfig.name) {
            let msg = format!("Duplicate name found: {}", pconfig.name);
            return Err(From::from(msg));
        }
        gc.players.insert(pconfig.name.clone(), pconfig);
    }
    
    println!("Config parsed succesfully");
    Ok(gc)
}

pub fn create_bot_handles(config: &GameConfig) -> BotHandles {
    println!("Launching bots");
    let mut children = BotHandles::new();

    for (player, pconfig) in config.players.iter() {
        let ref cmd = pconfig.start_command;
        let ref args = pconfig.args;
        let bot = Command::new(cmd)
            .args(args)
            .arg(player)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect(&format!("\n[DRIVER] Failed to execute process: {} {:?}\n", cmd, args));

        children.insert(player.clone(), bot);
    }
    
    children
}

// This doesn't do much
/*
pub fn check_bot_handles(children: &mut BotHandles){
    // Weak check to see whether bots were succesfully started.
    for (player, mut child) in children {
        let exit = child.try_wait();
        match exit {
            Ok(Some(status)) => {
                println!("Process for {} unsuccesfully launched or already terminated. Reason:\n{}", player, status);
                std::process::exit(1);
            },
            Err(e) => {
                println!("Error checking bot status for {}.\nReason: {}", player, e);
                std::process::exit(1);
            }
            Ok(None) => {
                println!("Process for {} succesfully launched.", player);
            }
        }
    }
}*/