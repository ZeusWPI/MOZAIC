use fnv::FnvHashMap;
use futures::{Future, Poll, Stream};
use futures::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tokio::net::TcpStream;
use client_controller::Command as ClientControllerCommand;

pub enum RouterCommand {
    RouteRequest {
        stream: TcpStream,
    },
    Close {
        connection_id: u64,
    },
}

pub struct Router {
    connections: FnvHashMap<u64, UnboundedSender<ClientControllerCommand>>,
    ctrl_chan: UnboundedReceiver<RouterCommand>,
}

impl Router {
    fn handle_command(&mut self, cmd: RouterCommand) {
        match cmd {
            RouterCommand::RouteRequest { stream } => {
                unimplemented!()
            },
            RouterCommand::Close { connection_id } => {
                self.connections.remove(&connection_id);
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