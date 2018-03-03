use futures::sync::mpsc::{UnboundedSender, SendError};

pub struct Packet {
    pub connection_id: u64,
    pub transport_id: u64,
    pub data: Vec<u64>,
}


pub enum RouterCommand {
    Send(Packet),
    Receive(Packet),
}

pub struct RouterHandle {
    handle: UnboundedSender<RouterCommand>,
}

impl RouterHandle {
    fn send_command(&mut self, cmd: RouterCommand) {
        self.handle.unbounded_send(cmd)
            .expect("Router control channel closed");
    }
    
    pub fn send(&mut self, packet: Packet) {
        let cmd = RouterCommand::Send(packet);
        self.send_command(cmd);
    }

    pub fn receive(&mut self, packet: Packet) {
        let cmd = RouterCommand::Receive(packet);
        self.send_command(cmd);
    }
}