use std::collections::HashMap;
use futures::sync::mpsc;

type Uuid = [u8; 16];

#[derive(PartialEq, Eq, Hash)]
struct ClientId {
    match_uuid: Uuid,
    client_num: u64,
}

//help
struct Broker {
    recv: mpsc::UnboundedReceiver<()>,
    actors: HashMap<ClientId, mpsc::UnboundedSender<()>>,
}