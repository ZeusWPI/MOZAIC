use std::collections::HashMap;
use std::collections::HashSet;

use serde::de::DeserializeOwned;
use std::marker::PhantomData;

use planetwars::game_controller::GameController;
use planetwars::lock::Lock;
use planetwars::controller::PlayerId;

#[derive(PartialEq)]
enum GameState {
    Waiting,
    Running,
    Timeout,
}

pub struct StepLock<G: GameController<C>, C: DeserializeOwned> {
    phantom_config: PhantomData<C>,
    client_messages: HashMap<PlayerId, Vec<u8>>,
    awaiting_clients: HashSet<PlayerId>,
    connected_clients: HashSet<PlayerId>,
    game_controller: G,
    running: GameState,
}

impl<G, C> Lock<G, C> for StepLock<G, C>
    where G: GameController<C>, C: DeserializeOwned
{
    fn new(game_controller: G, awaiting_clients: HashSet<PlayerId>) -> StepLock<G, C> {
        StepLock {
            phantom_config: PhantomData,
            client_messages: HashMap::new(),
            awaiting_clients: HashSet::new(),
            connected_clients: HashSet::new(),
            game_controller,
            running: GameState::Waiting,
        }
    }

    fn do_step(&mut self) -> (u64, Option<Vec<PlayerId>>) {
        match self.running {
            GameState::Waiting => {
                            self.running = GameState::Running;
                            self.awaiting_clients = self.game_controller.start();
                        },
            GameState::Running => self.awaiting_clients = self.game_controller.step(self.client_messages.clone()),
            GameState::Timeout => {
                let mut out = Vec::new();
                self.connected_clients.difference(& self.awaiting_clients).for_each(|x| out.push(*x));
                return (1000, Some(out));
            },
        }

        self.client_messages.clear();
        return (self.game_controller.time_out(), self.game_controller.outcome());
    }

    fn is_ready(&self) -> bool {
        match self.running {
            GameState::Waiting => self.connected_clients == self.awaiting_clients,
            GameState::Running => self.awaiting_clients.intersection(& self.connected_clients).count() == 0,
            GameState::Timeout => true,
        }
    }

    fn attach_command(&mut self, client_id: PlayerId, msg: Vec<u8>) {
        self.awaiting_clients.remove(&client_id);
        self.client_messages.insert(client_id, msg);
    }

    fn connect(&mut self, client_id: PlayerId) {
        self.connected_clients.insert(client_id);
    }

    fn disconnect(&mut self, client_id: PlayerId) {
        self.connected_clients.remove(&client_id);
    }

    fn do_time_out(&mut self) {
        self.awaiting_clients.clone().iter().for_each(|c| {
                                            self.client_messages.insert(*c, Vec::new());
                                            }
                                        );
        self.running = GameState::Timeout;
    }

    fn get_waiting(& self) -> HashSet<PlayerId> {
        let mut out = HashSet::new();
        self.awaiting_clients.intersection(& self.connected_clients).for_each(|id| {out.insert(id.clone());});
        out
    }
}