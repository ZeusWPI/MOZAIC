use std::collections::HashMap;
use std::collections::HashSet;

pub struct StepLock {
    client_messages: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
}

impl StepLock {
    pub fn new() -> StepLock {
        StepLock {
            client_messages: HashMap::new(),
            awaiting_clients: HashSet::new(),
        }
    }

    pub fn wait_for(&mut self, client_id: usize){
        self.awaiting_clients.insert(client_id);
    }

    pub fn is_ready(&self) -> bool {
        self.awaiting_clients.is_empty()
    }

    pub fn attach_command(&mut self, client_id: usize, msg: String){
        self.client_messages.insert(client_id, msg);
        self.awaiting_clients.remove(&client_id);
    }
}