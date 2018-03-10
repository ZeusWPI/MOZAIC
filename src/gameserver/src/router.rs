use std::collections::HashMap;
use futures::{Future, Poll, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tokio::net::TcpStream;
use client_controller::Command as ClientControllerCommand;
use protobuf_codec::ProtobufTransport;


pub enum RouterCommand {
    Connect {
        stream: ProtobufTransport<TcpStream>,
        token: Vec<u8>,
    },
    Register {
        handle: UnboundedSender<ClientControllerCommand>,
        token: Vec<u8>,
    },
    Unregister {
        token: Vec<u8>,
    }
}

pub struct Router {
    connections: HashMap<Vec<u8>, UnboundedSender<ClientControllerCommand>>,
    ctrl_chan: UnboundedReceiver<RouterCommand>,
}

impl Router {
    pub fn new(ctrl_chan: UnboundedReceiver<RouterCommand>) -> Self {
        Router {
            ctrl_chan,
            connections: HashMap::new(),
        }
    } 

    fn handle_command(&mut self, cmd: RouterCommand) {
        match cmd {
            RouterCommand::Connect { token, stream } => {
                let connection = self.connections.get(&token);
                if let Some(handle) = connection {
                    let cmd = ClientControllerCommand::Connect(stream);
                    handle.unbounded_send(cmd).unwrap();
                }
            },
            RouterCommand::Register { token, handle } => {
                self.connections.insert(token, handle);
            },
            RouterCommand::Unregister { token } => {
                self.connections.remove(&token);
            }
        }
    }
}

impl Future for Router {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            let cmd = try_ready!(self.ctrl_chan.poll()).unwrap();
            self.handle_command(cmd);
        }
    }
}