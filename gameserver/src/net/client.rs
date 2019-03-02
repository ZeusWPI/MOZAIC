use super::*;

use client::runtime::{Runtime, BrokerHandle};
use messaging::reactor::CoreParams;
use messaging::types::{Message, VecSegment, ReactorId};

use futures::sync::mpsc;
use tokio::net::TcpStream;
use rand::Rng;

use super::connection_handler::*;

use network_capnp::{connect, connected, publish};



pub struct ClientHandler<S> {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,

    client_id: ReactorId,
    spawner: Option<Box<Fn(ReactorId) -> CoreParams<S, Runtime> + Send>>, 
}

impl<S> ClientHandler<S>
    where S: Send + 'static
{
    pub fn new<F>(stream: TcpStream, broker: BrokerHandle, spawner: F)
        -> ConnectionHandler<Self>
        where F: 'static + Send + Fn(ReactorId) -> CoreParams<S, Runtime>
    {
        let client_id: ReactorId = rand::thread_rng().gen();
        let mut h = ConnectionHandler::new(stream, |tx| {
            let mut handler = HandlerCore::new(ClientHandler {
                broker,
                tx,
                client_id: client_id.clone(),
                spawner: Some(Box::new(spawner)),
            });
            handler.on(publish::Owned, MsgHandler::new(Self::publish_message));
            handler.on(connected::Owned, MsgHandler::new(Self::handle_connected));
            return handler;
        });

        h.writer().write(connect::Owned, |b| {
            let mut b: connect::Builder = b.init_as();
            b.set_id(client_id.bytes());
        });

        return h;
    }

    fn handle_connected(&mut self, w: &mut Writer, r: connected::Reader)
        -> Result<(), capnp::Error>
    {
        let spawner = match self.spawner.take() {
            None => return Ok(()),
            Some(spawner) => spawner,
        };

        let remote_id: ReactorId = r.get_id()?.into();
        self.broker.register(remote_id.clone(), self.tx.clone());

        println!("connected to {:?}!", remote_id);

        let r = spawner(remote_id);
        self.broker.spawn(self.client_id.clone(), r);
        return Ok(());
    }


    fn publish_message(&mut self, w: &mut Writer, r: publish::Reader)
        -> Result<(), capnp::Error>
    {
        let vec_segment = VecSegment::from_bytes(r.get_message()?);
        let message = Message::from_segment(vec_segment);
        self.broker.dispatch_message(message);
        return Ok(());
    }
}