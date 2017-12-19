use std::collections::HashMap;
use std::collections::HashSet;

pub struct StepLock {
    awaiting_input_map: HashMap<usize, String>,
    awaiting_clients: HashSet<usize>,
}

impl StepLock {
    pub fn new() -> StepLock {
        StepLock {
            awaiting_input_map: HashMap::new(),
            awaiting_clients: HashSet::new(),
        }
    }

    pub fn wait_for(&mut self, client_id: usize){
        awaiting_clients.insert(client_id);
    }

    pub fn has_all_commands(&self) -> bool {
        self.awaiting_clients.is_empty()
    }

    pub fn attach_command(&mut self, client_id: usize, msg: String){
        self.awaiting_input_map.insert(client_id, msg);
        self.awaiting_clients.remove(&client_id);
    }
}