use std::collections::HashMap;
use futures::sync::mpsc;

//help
struct Broker {
    recv: mpsc::UnboundedReceiver<()>,
    actors: HashMap<Vec<u8>, mpsc::UnboundedSender<()>>,
}