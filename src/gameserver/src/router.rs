use std::collections::HashMap;
use futures::{Future, Poll, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use futures::sync::oneshot;
use tokio::net::TcpStream;
use client_controller::Command as ClientControllerCommand;
use protobuf_codec::ProtobufTransport;

pub enum TableCommand {
    Lookup {
        token: Vec<u8>,
        chan: oneshot::Sender<Option<UnboundedSender<ClientControllerCommand>>>,
    },
    Insert {
        token: Vec<u8>,
        value: UnboundedSender<ClientControllerCommand>,
    },
    Remove {
        token: Vec<u8>,
    }
}

pub struct RoutingTable {
    connections: HashMap<Vec<u8>, UnboundedSender<ClientControllerCommand>>,
    ctrl_chan: UnboundedReceiver<TableCommand>,
}

impl RoutingTable {
    pub fn new(ctrl_chan: UnboundedReceiver<TableCommand>) -> Self {
        RoutingTable {
            ctrl_chan,
            connections: HashMap::new(),
        }
    } 

    fn handle_command(&mut self, cmd: TableCommand) {
        match cmd {
            TableCommand::Lookup { token, chan } => {
                let value = self.connections.get(&token).cloned();
                match chan.send(value) {
                    Ok(()) => return (),
                    Err(_) => panic!("oneshot channel closed"),
                }
            },
            TableCommand::Insert { token, value } => {
                self.connections.insert(token, value);
            },
            TableCommand::Remove { token } => {
                self.connections.remove(&token);
            }
        }
    }
}

impl Future for RoutingTable {
    type Item = ();
    type Error = ();

    fn poll(&mut self) -> Poll<(), ()> {
        loop {
            let cmd = try_ready!(self.ctrl_chan.poll()).unwrap();
            self.handle_command(cmd);
        }
    }
}