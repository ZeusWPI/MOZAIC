use std::collections::HashMap;
use futures::sync::mpsc::UnboundedSender;

pub struct PwController {
    client_handles: HashMap<usize, UnboundedSender<String>>,
    planet_map: HashMap<String, usize>,
}