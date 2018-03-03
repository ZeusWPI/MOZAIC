use futures::sync::mpsc::UnboundedSender;

use router::Packet;

pub enum TransportCommand {
    Send(Packet),
}

pub struct TransportHandle {
    handle: UnboundedSender<TransportCommand>,
}

impl TransportHandle {
    fn send_command(&mut self, cmd: TransportCommand) {
        self.handle.unbounded_send(cmd)
            .expect("Transport control channel closed");
    }
    
    pub fn send(&mut self, packet: Packet) {
        let cmd = TransportCommand::Send(packet);
        self.send_command(cmd);
    }
}