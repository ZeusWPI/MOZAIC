use std::env;

extern crate sodiumoxide;
extern crate serde_json;
extern crate tokio;
extern crate futures;
extern crate mozaic;
extern crate rand;
extern crate capnp;

use std::net::SocketAddr;
use mozaic::core_capnp::{initialize, actor_joined, greeting};
use mozaic::messaging::types::*;
use mozaic::messaging::reactor::*;
use mozaic::server::run_server;

pub mod chat {
    include!(concat!(env!("OUT_DIR"), "/chat_capnp.rs"));
}

// Load the config and start the game.
fn main() {
    run(env::args().collect());
}


struct Welcomer {
    runtime_id: ReactorId,
}

impl Welcomer {
    fn params<C: Ctx>(self) -> CoreParams<Self, C> {
        let mut params = CoreParams::new(self);
        params.handler(initialize::Owned, CtxHandler::new(Self::initialize));
        params.handler(actor_joined::Owned, CtxHandler::new(Self::welcome));
        return params;
    }

    fn initialize<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        _: initialize::Reader,
    ) -> Result<(), capnp::Error>
    {
        let link = WelcomerRuntimeLink {};
        handle.open_link(link.params(self.runtime_id.clone()));
        return Ok(());
    }

    fn welcome<C: Ctx>(
        &mut self,
        handle: &mut ReactorHandle<C>,
        r: actor_joined::Reader,
    ) -> Result<(), capnp::Error>
    {
        let id: ReactorId = r.get_id()?.into();
        println!("welcoming {:?}", id);
        let link = WelcomerGreeterLink {};
        handle.open_link(link.params(id));
        handle.send_internal(chat::send_message::Owned, |b| {
            let mut send: chat::send_message::Builder = b.init_as();
            send.set_message("hoi!");
        });
        return Ok(());
    }

}

struct WelcomerRuntimeLink {}

impl WelcomerRuntimeLink {
    fn params<C: Ctx>(self, foreign_id: ReactorId) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_id, self);
        params.external_handler(
            actor_joined::Owned,
            CtxHandler::new(Self::welcome),
        );

        return params;
    }

    fn welcome<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        r: actor_joined::Reader,
    ) -> Result<(), capnp::Error>
    {
        let id: ReactorId = r.get_id()?.into();
        handle.send_internal(actor_joined::Owned, |b| {
            let mut joined: actor_joined::Builder = b.init_as();
            joined.set_id(id.bytes())
        });
        return Ok(());
    }
}

struct WelcomerGreeterLink {}

impl WelcomerGreeterLink {
    fn params<C: Ctx>(self, foreign_id: ReactorId) -> LinkParams<Self, C> {
        let mut params = LinkParams::new(foreign_id, self);
        params.external_handler(
            chat::chat_message::Owned,
            CtxHandler::new(Self::recv_chat_message),
        );
        params.internal_handler(
            chat::chat_message::Owned,
            CtxHandler::new(Self::send_chat_message),
        );

        return params;
    }

    fn send_chat_message<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        message: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let content = message.get_message()?;

        handle.send_message(chat::chat_message::Owned, |b| {
            let mut msg: chat::chat_message::Builder = b.init_as();
            msg.set_message(content);
        });
        return Ok(());
    }

    fn recv_chat_message<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        message: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let message = message.get_message()?;

        handle.send_internal(chat::chat_message::Owned, |b| {
            let mut msg: chat::chat_message::Builder = b.init_as();
            msg.set_message(message);
        });

        return Ok(());
    }
}

pub fn run(_args : Vec<String>) {

    let addr = "127.0.0.1:9142".parse::<SocketAddr>().unwrap();

    run_server(addr, |runtime_id| {
        let w = Welcomer { runtime_id };
        return w.params();
    });
}
