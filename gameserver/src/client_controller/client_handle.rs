use tokio::net::TcpStream;
use futures::sync::mpsc::{unbounded, UnboundedSender, UnboundedReceiver};


pub struct ClientHandle {
    sender: UnboundedSender<Command>,
}

impl ClientHandle {
    pub fn new(sender: UnboundedSender<Command>) -> Self {
        ClientHandle {
            sender: sender,
        }
    }

    pub fn send(&mut self, data: Vec<u8>) {
        let cmd = Command::Send(data);
        let res = self.sender.unbounded_send(cmd);
        res.unwrap();
    }

    pub fn connect(&mut self, stream: TcpStream) {
        let 
    }
}