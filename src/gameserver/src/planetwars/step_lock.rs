use std::collections::HashMap;
use std::collections::HashSet;

use planetwars::game_controller::GameController;

enum GameState {
    Waiting,
    Running,
}

pub struct StepLock<G: GameController> {
    client_messages: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
    game_controller: G,
    running: GameState,
}

impl<G> StepLock<G>
    where G: GameController 
{
    pub fn new(game_controller: G) -> StepLock<G> {
        StepLock {
            client_messages: HashMap::new(),
            awaiting_clients: HashSet::new(),
            game_controller,
            running: GameState::Waiting,
        }
    }

    pub fn do_step(&mut self) -> Option<Vec<usize>> {
        if self.awaiting_clients.is_empty() {
            match self.running {
                GameState::Waiting => {
                                self.running = GameState::Running;
                                self.awaiting_clients = self.game_controller.start();
                            },
                GameState::Running => self.awaiting_clients = self.game_controller.step(self.client_messages.clone()),
            }
            self.client_messages.clear();
            return self.game_controller.outcome();
        }
        return None;
    }

    pub fn is_ready(&self) -> bool {
        self.awaiting_clients.is_empty()
    }

    pub fn attach_command(&mut self, client_id: usize, msg: String) {
        self.client_messages.insert(client_id, msg);
        self.awaiting_clients.remove(&client_id);
    }

    pub fn remove(&mut self, client_id: usize) {
        self.client_messages.remove(&client_id);
        self.awaiting_clients.remove(&client_id);

    }

    /// This will be useful to check for time-outs
    pub fn act(&mut self) {
        
    }
}