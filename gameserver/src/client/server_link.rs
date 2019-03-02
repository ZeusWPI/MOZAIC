use super::*;
use std::sync::{Arc, Mutex};

use client::runtime::{Runtime, RuntimeState, spawn_reactor};
use messaging::reactor::CoreParams;
use messaging::types::{Message, VecSegment, ReactorId};

use futures::sync::mpsc;
use tokio::net::TcpStream;
use rand::Rng;

use net::connection_handler::*;

use network_capnp::{connect, connected, publish};

pub struct ClientParams {
    pub runtime_id: ReactorId,
    pub greeter_id: ReactorId,
}

// TODO: get rid of this type parameter
pub struct LinkHandler<S> {
    runtime: Arc<Mutex<RuntimeState>>,

    // TODO: UGH clean up this mess wtf
    client_id: ReactorId,
    spawner: Option<Box<Fn(ClientParams) -> CoreParams<S, Runtime> + Send>>, 
}

impl<S> LinkHandler<S>
    where S: Send + 'static
{
    pub fn new<F>(stream: TcpStream, spawner: F)
        -> ConnectionHandler<Self>
        where F: 'static + Send + Fn(ClientParams) -> CoreParams<S, Runtime>
    {

        let client_id: ReactorId = rand::thread_rng().gen();

        let mut h = ConnectionHandler::new(stream, |tx| {
            // TODO: this way of bootstrapping is not ideal
            let runtime = Arc::new(Mutex::new(RuntimeState::new(tx)));

            let mut handler = HandlerCore::new(LinkHandler {
                runtime,
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

        let greeter_id: ReactorId = r.get_id()?.into();

        println!("connected to {:?}!", greeter_id);

        let r = spawner(ClientParams {
            runtime_id: self.runtime.lock().unwrap().runtime_id().clone(),
            greeter_id,
        });
        spawn_reactor(&self.runtime, self.client_id.clone(), r);
        return Ok(());
    }


    fn publish_message(&mut self, w: &mut Writer, r: publish::Reader)
        -> Result<(), capnp::Error>
    {
        let vec_segment = VecSegment::from_bytes(r.get_message()?);
        let message = Message::from_segment(vec_segment);
        self.runtime.lock().unwrap().dispatch_message(message);
        return Ok(());
    }
}