use server::runtime::{Broker, BrokerHandle};
use messaging::types::{Message, VecSegment, ReactorId};

use futures::sync::mpsc;
use tokio::net::TcpStream;

use super::connection_handler::*;

use network_capnp::{connect, connected, publish};
use core_capnp::{actor_joined};



pub struct ServerHandler {
    broker: BrokerHandle,
    tx: mpsc::UnboundedSender<Message>,
    welcomer_id: ReactorId,
}

impl ServerHandler {
    pub fn new(stream: TcpStream, broker: BrokerHandle, welcomer_id: ReactorId)
        -> ConnectionHandler<Self>
    {
        ConnectionHandler::new(stream, |tx| {
            let mut handler = HandlerCore::new(ServerHandler {
                broker,
                tx,
                welcomer_id,
            });
            handler.on(publish::Owned, MsgHandler::new(Self::publish_message));
            handler.on(connect::Owned, MsgHandler::new(Self::handle_connect));
            return handler;
        })
    }

    fn handle_connect(&mut self, w: &mut Writer, r: connect::Reader)
        -> Result<(), capnp::Error>
    {
        let connecting_id: ReactorId = r.get_id()?.into();
        self.broker.register(connecting_id.clone(), self.tx.clone());

        self.broker.send_message(&self.welcomer_id, actor_joined::Owned, |b| {
            let mut joined: actor_joined::Builder = b.init_as();
            joined.set_id(connecting_id.bytes());
        });

        w.write(connected::Owned, |b| {
            let mut connected: connected::Builder = b.init_as();
            connected.set_id(self.welcomer_id.bytes());
        });
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