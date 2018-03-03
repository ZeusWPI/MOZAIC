use futures::sync::mpsc::{UnboundedSender};

pub use super::types::*;

pub struct Connection {
    id: u64,
}

pub enum ConnectionCommand {
    Receive(Packet),
}

pub struct ConnectionHandle {
    handle: UnboundedSender<ConnectionCommand>,
}

impl ConnectionHandle {
    fn send_command(&mut self, cmd: ConnectionCommand) {
        self.handle.unbounded_send(cmd)
            .expect("Connection control channel closed");
    }
    
    pub fn receive(&mut self, packet: Packet) {
        let cmd = ConnectionCommand::Receive(packet);
        self.send_command(cmd);
    }
}