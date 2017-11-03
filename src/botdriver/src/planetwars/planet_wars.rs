use std::io;
use std::collections::HashMap;

use futures::{Future, Async, Poll};
use futures::future::{join_all, JoinAll};

use serde_json as json;

use bot_runner::BotHandle;
use planetwars::protocol as proto;
use planetwars::rules::*;
use planetwars::player::{PlayerHandle, Prompt};
use planetwars::logger::PlanetWarsLogger;
use planetwars::Config;

pub struct Match {
    state: PlanetWars,
    prompts: Prompts,
    logger: PlanetWarsLogger,
}

impl Future for Match {
    // names of winners
    type Item = Vec<String>;
    type Error = io::Error;

    fn poll(&mut self) -> Poll<Self::Item, Self::Error> {
        loop {
            // Prompts never error, unwrapping is fine
            let results = match self.prompts.poll().unwrap() {
                Async::Ready(results) => results,
                Async::NotReady => return Ok(Async::NotReady),
            };

            self.state.repopulate();

            let mut player_handles = HashMap::new();
            for (player_id, result) in results.into_iter() {
                match result {
                    Ok((command, player_handle)) => {
                        player_handles.insert(player_id, player_handle);
                        self.handle_command(player_id, command);
                    },
                    Err(err) => {
                        println!("player {}: {}", player_id, err);
                    },
                }
            }

            self.state.step();
            self.logger.log(&self.state).expect("[PLANET_WARS] logging failed");
            
            if self.state.is_finished() {
                return Ok(Async::Ready(self.state.living_players()));
            } else {
                self.prompts = prompt_players(&self.state, player_handles);
            }
        }
    }
}

impl Match {
    // TODO: split this method a bit
    pub fn new(mut players: HashMap<String, BotHandle>, conf: Config) -> Self {
        // construct player map
        let player_map: HashMap<usize, Player> = players.keys().enumerate()
            .map(|(num, name)| {
                let player = Player {
                    id: num,
                    name: name.clone(),
                    alive: true,
                };
                return (num, player);
            }).collect();

        let handles = player_map.values().map(|player| {
            let handle = players.remove(&player.name).unwrap();
            (player.id, PlayerHandle::new(handle))
        }).collect();

        let state = conf.create_game(player_map);

        let mut logger = PlanetWarsLogger::new("log.json");
        logger.log(&state).expect("[PLANET_WARS] logging failed");

        return Match {
            prompts: prompt_players(&state, handles),
            state: state,
            logger: logger,
        }
    }

    fn handle_command(&mut self,
                      player_id: usize,
                      command: json::Result<proto::Command>)
    {
        match command {
            Ok(proto::Command { moves }) => {
                for mv in moves {
                    self.handle_move(player_id, &mv);
                }
            },
            Err(err) => {
                // TODO: actually log this
                println!("player {}: {}", player_id, err);
            }
        }
    }

    
    
    fn handle_move(&mut self, player_id: usize, m: &proto::Move) {
        if self.check_move(player_id, m) {
            self.state.dispatch(m);
        }
    }

    // TODO: actual logging
    fn check_move(&self, player_id: usize, m: &proto::Move) -> bool {
        // check whether origin and target exist
        if !self.state.planets.contains_key(&m.origin) {
            println!("player {}: {:?}: origin planet does not exist",
                     player_id, m);
            return false;
        }
        if !self.state.planets.contains_key(&m.destination) {
            println!("player {}: {:?}: destination planet does not exist",
                     player_id, m);
            return false;
        }

        // check whether player owns origin and has enough ships there
        let origin = &self.state.planets[&m.origin];
        
        if origin.owner() != Some(player_id) {
            println!("player {}: {:?}: origin planet not controlled",
                     player_id, m);
            return false;
        }
        if origin.ship_count() < m.ship_count {
            println!("player {}: {:?}: not enough ships",
                     player_id, m);
            return false;
        }
        return true;
    }
}

// TODO: as this logic gets more complicated, it might be good to
// sparate this functionality into a purpose-specific struct.
fn prompt_players(state: &PlanetWars, handles: HashMap<usize, PlayerHandle>)
                  -> Prompts
{
    let prompts = handles.into_iter().filter_map(|(id, handle)| {
        let player = &state.players[&id];
        
        if player.alive {
            let state = state.repr();
            Some((id, handle.prompt(state)))
        } else {
            None
        }
    });
    return Prompts::from_map(prompts.collect());
}

struct Prompts {
    ids: Vec<usize>,
    future: JoinAll<Vec<Prompt>>,
}

impl Prompts {
    fn from_map(prompts: HashMap<usize, Prompt>) -> Self {
        let (ids, futures) = prompts.into_iter().unzip();
        Prompts {
            ids: ids,
            future: join_all(futures),
        }
    }
}

impl Future for Prompts {
    type Item = HashMap<usize, io::Result<(json::Result<proto::Command>, PlayerHandle)>>;
    type Error = ();

    fn poll(&mut self) -> Poll<Self::Item, Self::Error> {
        let responses = try_ready!(self.future.poll());

        let res = responses.into_iter().enumerate().map(|(i, response)| {
            let id = self.ids[i];
            (id, response)
        }).collect();

        return Ok(Async::Ready(res));
    }
}
