use super::*;

use messaging::runtime::{Runtime, Broker, BrokerHandle};
use messaging::reactor::CoreParams;
use messaging::types::{Message, VecSegment, Uuid, set_uuid};

use futures::sync::mpsc;
use tokio::net::TcpStream;
use rand::Rng;

use super::connection_handler::*;

use network_capnp::{connect, connected, publish};



pub struct ClientHandler<S> {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,

    client_id: Uuid,
    spawner: Option<Box<Fn(Uuid) -> CoreParams<S, Runtime> + Send>>, 
}

impl<S> ClientHandler<S>
    where S: Send + 'static
{
    pub fn new<F>(stream: TcpStream, broker: BrokerHandle, spawner: F)
        -> ConnectionHandler<Self>
        where F: 'static + Send + Fn(Uuid) -> CoreParams<S, Runtime>
    {
        let client_id: Uuid = rand::thread_rng().gen();
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
            let b: connect::Builder = b.init_as();
            set_uuid(b.init_id(), &client_id)
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

        let remote_uuid: Uuid = r.get_id()?.into();
        self.broker.register(remote_uuid.clone(), self.tx.clone());

        println!("connected to {:?}!", remote_uuid);

        let r = spawner(remote_uuid);
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