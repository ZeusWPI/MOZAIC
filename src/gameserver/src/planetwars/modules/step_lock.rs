use std::collections::HashMap;
use std::collections::HashSet;

use serde::de::DeserializeOwned;
use std::marker::PhantomData;

use planetwars::game_controller::GameController;
use planetwars::lock::Lock;

use std::time::{SystemTime, UNIX_EPOCH};

#[derive(PartialEq)]
enum GameState {
    Waiting,
    Running,
    Stopped,
}

pub struct StepLock<G: GameController<C>, C: DeserializeOwned> {
    phantom_config: PhantomData<C>,
    client_messages: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
    connected_clients: HashSet<usize>,
    game_controller: G,
    running: GameState,
    time_out: u64,
}

fn get_current_time() -> u64{
    let start = SystemTime::now();
    let since_the_epoch = start.duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    since_the_epoch.as_secs() * 1000 +
        since_the_epoch.subsec_nanos() as u64 / 1_000_000
}

impl<G, C> Lock<G, C> for StepLock<G, C>
    where G: GameController<C>, C: DeserializeOwned
{
    fn new(game_controller: G, awaiting_clients: HashSet<usize>, connection_time_out: u64) -> StepLock<G, C> {
        StepLock {
            phantom_config: PhantomData,
            client_messages: HashMap::new(),
            awaiting_clients,
            connected_clients: HashSet::new(),
            game_controller,
            running: GameState::Waiting,
            time_out: connection_time_out + get_current_time(),
        }
    }

    fn do_step(&mut self) -> Option<Vec<usize>> {
        match self.running {
            GameState::Waiting => {
                            self.running = GameState::Running;
                            let (ac, time) = self.game_controller.start();
                            self.awaiting_clients = ac;
                            self.time_out = time + get_current_time();                        },
            GameState::Running => {
                            let (ac, time) = self.game_controller.step(self.client_messages.clone());
                            self.awaiting_clients = ac;
                            self.time_out = time + get_current_time();
                        },
            GameState::Stopped => return Some(Vec::new()),
        }
        self.client_messages.clear();
        return self.game_controller.outcome();
    }

    fn is_ready(&self) -> bool {
        match self.running {
            GameState::Waiting => self.connected_clients == self.awaiting_clients,
            GameState::Running => self.awaiting_clients.intersection(& self.connected_clients).count() == 0,
            GameState::Stopped => true,
        }
    }

    fn attach_command(&mut self, client_id: usize, msg: String) {
        self.client_messages.insert(client_id, msg);
        self.awaiting_clients.remove(&client_id);
    }

    fn connect(&mut self, client_id: usize) {
        self.connected_clients.insert(client_id);
    }

    fn disconnect(&mut self, client_id: usize) {
        self.connected_clients.remove(&client_id);
    }

    /// This will be useful to check for time-outs
    fn act(&mut self) -> Option<Vec<usize>> {
        if self.time_out < get_current_time() { // current time
            if self.running == GameState::Waiting {
                println!("Initial connection time-out for bots {:?}", self.awaiting_clients);
                self.running = GameState::Stopped;
            }else{
                println!("Connection time-out for bots {:?}", self.awaiting_clients.intersection(& self.connected_clients));
            }
            return self.do_step();
        }
        if self.is_ready() {
            return self.do_step();
        }
        return None;
    }
}