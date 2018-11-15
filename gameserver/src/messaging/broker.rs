use std::collections::HashMap;
use futures::sync::mpsc;

use super::reactor::Uuid;

//help
struct Broker {
    recv: mpsc::UnboundedReceiver<()>,
    actors: HashMap<Uuid, mpsc::UnboundedSender<()>>,
}