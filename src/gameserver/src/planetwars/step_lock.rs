use std::collections::HashMap;
use std::collections::HashSet;

use planetwars::pw_controller::PwController;
use planetwars::controller::Client;
use planetwars::config::Config;

use slog;
use std::mem;


pub struct StepLock {
    client_messages: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
    pw_controller: PwController,
    running: bool,
}

impl StepLock {
    pub fn new(conf: Config, clients: Vec<Client>, logger: slog::Logger) -> StepLock {
        let mut awaiting_clients = HashSet::new();
        awaiting_clients.extend(clients.iter().map(|a| a.id));
        StepLock {
            client_messages: HashMap::new(),
            awaiting_clients: awaiting_clients,
            pw_controller: PwController::new(conf, clients, logger),
            running: false,
        }
    }

    pub fn do_step(&mut self) -> Option<Vec<usize>> {
        if self.awaiting_clients.is_empty() {
            if self.running {
                mem::replace(&mut self.awaiting_clients, 
                    self.pw_controller.step(self.client_messages.clone())
                    );
            }else{
                mem::replace(&mut self.awaiting_clients, 
                    self.pw_controller.start()
                    );
                self.running = true;
            }
            self.client_messages.clear();
            return self.pw_controller.outcome();
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
        self.pw_controller.handle_disconnect(client_id);
        self.client_messages.remove(&client_id);
        self.awaiting_clients.remove(&client_id);
    }

    /// This will be useful to check for time-outs
    pub fn act(&mut self) {

    }
}