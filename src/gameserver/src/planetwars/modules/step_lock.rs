use std::collections::HashMap;
use std::collections::HashSet;

use serde::de::DeserializeOwned;
use std::marker::PhantomData;

use planetwars::game_controller::GameController;
use planetwars::lock::Lock;

enum GameState {
    Waiting,
    Running,
}

pub struct StepLock<G: GameController<C>, C: DeserializeOwned> {
    phantom_config: PhantomData<C>,
    client_messages: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
    connected_clients: HashSet<usize>,
    game_controller: G,
    running: GameState,
}

impl<G, C> Lock<G, C> for StepLock<G, C>
    where G: GameController<C>, C: DeserializeOwned
{
    fn new(game_controller: G, awaiting_clients: HashSet<usize>) -> StepLock<G, C> {
        StepLock {
            phantom_config: PhantomData,
            client_messages: HashMap::new(),
            awaiting_clients,
            connected_clients: HashSet::new(),
            game_controller,
            running: GameState::Waiting,
        }
    }

    fn do_step(&mut self) -> (usize, Option<Vec<usize>>) {
        match self.running {
            GameState::Waiting => {
                            self.running = GameState::Running;
                            self.awaiting_clients = self.game_controller.start();
                        },
            GameState::Running => self.awaiting_clients = self.game_controller.step(self.client_messages.clone()),
        }
        self.client_messages.clear();
        return (self.game_controller.time_out(), self.game_controller.outcome());
    }

    fn is_ready(&self) -> bool {
        match self.running {
            GameState::Waiting => self.connected_clients == self.awaiting_clients,
            GameState::Running => self.awaiting_clients.intersection(& self.connected_clients).count() == 0
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

    fn do_time_out(&mut self) -> (usize, Option<Vec<usize>>) {
        self.awaiting_clients.clone().iter().for_each(|c| {
                                            self.client_messages.insert(*c, String::new());
                                            }
                                        );
        self.do_step()
    }
}