use fnv::FnvHashMap;

use super::{ConnectionHandle, TransportHandle};
use super::types::*;


struct Router {
    connections: FnvHashMap<u64, ConnectionHandle>,
    transports: FnvHashMap<u64, TransportHandle>,
}

impl Router {
    fn send(&mut self, packet: Packet) {
        unimplemented!()
    }

    fn receive(&mut self, packet: Packet) {
        unimplemented!()
    }
}