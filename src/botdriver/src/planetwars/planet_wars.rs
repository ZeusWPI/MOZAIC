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

            // TODO: this is not really nice here
            let rs = results.results.into_iter().map(|(id, result)| {
                // if we got an outer Err, something bad happened
                let r = result.expect(&format!("lost connection with player {}", id));
                return (id, r);
            }).collect();
            

            self.state.repopulate();
            self.execute_commands(&rs);
            self.state.step();
            self.logger.log(&self.state).expect("[PLANET_WARS] logging failed");
            
            if self.state.is_finished() {
                return Ok(Async::Ready(self.state.living_players()));
            } else {
                self.prompts = prompt_players(&self.state, results.handles);
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

        // construct planet map
        let planets = conf.load_map(&player_map).into_iter()
            .map(|planet| {
                (planet.name.clone(), planet)
            }).collect();

        let handles = player_map.values().map(|player| {
            let handle = players.remove(&player.name).unwrap();
            (player.id, PlayerHandle::new(handle))
        }).collect();

        let state = PlanetWars {
            planets: planets,
            players: player_map,
            expeditions: Vec::new(),
            expedition_num: 0,
            turn_num: 0,
            max_turns: conf.max_turns,
        };

        let mut logger = PlanetWarsLogger::new("log.json");
        logger.log(&state).expect("[PLANET_WARS] logging failed");

        return Match {
            prompts: prompt_players(&state, handles),
            state: state,
            logger: logger,
        }
    }

    // TODO: this logic needs to move
    fn execute_commands(&mut self, commands: &HashMap<usize, json::Result<proto::Command>>) {
        for (&id, msg) in commands {
            if let Ok(cmd) = msg.as_ref() {
                for mv in cmd.moves.iter() {
                    match self.check_move(id, mv) {
                        Ok(()) => self.state.dispatch(mv),
                        Err(err) => panic!(err), // TODO
                    }
                }
            }
        }
    }
    
    fn check_move(&mut self, player_id: usize, m: &proto::Move)
        -> Result<(), String>
    {
        // check whether origin and target exist
        if !self.state.planets.contains_key(&m.origin) {
            return Err("origin planet does not exist".to_string());
        }
        if !self.state.planets.contains_key(&m.destination) {
            return Err("destination planet does not exist".to_string());
        }

        // check whether player owns origin and has enough ships there
        let origin = &self.state.planets[&m.origin];
        
        if origin.owner() != Some(player_id) {
            return Err("origin planet not controlled".to_string());
        }
        if origin.ship_count() < m.ship_count {
            return Err("not enough ships".to_string());
        }

        Ok(())
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

struct PromptResults {
    results: HashMap<usize, io::Result<json::Result<proto::Command>>>,
    handles: HashMap<usize, PlayerHandle>,
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
    type Item = PromptResults;
    type Error = ();

    fn poll(&mut self) -> Poll<Self::Item, Self::Error> {
        let responses = try_ready!(self.future.poll());
        let mut results = HashMap::with_capacity(responses.len());
        let mut handles = HashMap::with_capacity(responses.len());

        for (i, response) in responses.into_iter().enumerate() {
            let id = self.ids[i];
            match response {
                Ok((answer, handle)) => {
                    results.insert(id, Ok(answer));
                    handles.insert(id, handle);
                },
                Err(err) => {
                    results.insert(id, Err(err));
                }
            }
        }
        return Ok(Async::Ready( PromptResults { results, handles }));
    }
}
