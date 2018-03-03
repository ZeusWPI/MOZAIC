use fnv::FnvHashMap;
use futures::{Future, Poll, Stream};
use futures::sync::mpsc::{UnboundedReceiver};

use transports::TransportHandle;

use super::ConnectionHandle;
use super::types::*;


pub struct Router {
    connections: FnvHashMap<u64, ConnectionHandle>,
    transports: FnvHashMap<u64, TransportHandle>,
    ctrl_chan: UnboundedReceiver<RouterCommand>,
}

impl Router {
    fn send(&mut self, packet: Packet) {
        let transport = self.transports.get_mut(&packet.transport_id);
        if let Some(t) = transport {
            t.send(packet);
        } else {
            unimplemented!()
        }
    }

    fn receive(&mut self, packet: Packet) {
        let connection = self.connections.get_mut(&packet.connection_id);
        if let Some(c) = connection {
            c.receive(packet);
        } else {
            unimplemented!()
        }
    }
}

impl Future for Router {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            let cmd = try_ready!(self.ctrl_chan.poll()).unwrap();
            match cmd {
                RouterCommand::Send(packet) => self.send(packet),
                RouterCommand::Receive(packet) => self.receive(packet),
            };
        }
    }
}