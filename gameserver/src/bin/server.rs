use std::env;

extern crate sodiumoxide;
extern crate serde_json;
extern crate tokio;
extern crate futures;
extern crate mozaic;
extern crate rand;
extern crate capnp;

use std::net::SocketAddr;
use mozaic::core_capnp::{initialize, actor_joined};
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
        params.handler(
            chat::chat_message::Owned,
            CtxHandler::new(Self::print_chat_message)
        );
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
        return Ok(());
    }

    fn print_chat_message<C: Ctx>(
        &mut self,
        _: &mut ReactorHandle<C>,
        msg: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        println!("{}: {}",msg.get_user()? ,msg.get_message()?);
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
        
        let mut joined = MsgBuffer::<actor_joined::Owned>::new();
        joined.build(|b| b.set_id(id.bytes()));
        handle.send_internal(joined);
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
        let user = message.get_user()?;

        let mut chat_message = MsgBuffer::<chat::chat_message::Owned>::new();
        chat_message.build(|b| {
            b.set_message(content);
            b.set_user(user);
        });
        handle.send_message(chat_message);

        return Ok(());
    }

    fn recv_chat_message<C: Ctx>(
        &mut self,
        handle: &mut LinkHandle<C>,
        message: chat::chat_message::Reader,
    ) -> Result<(), capnp::Error>
    {
        let content = message.get_message()?;
        let user = message.get_user()?;

        let mut chat_message = MsgBuffer::<chat::chat_message::Owned>::new();
        chat_message.build(|b| {
            b.set_message(content);
            b.set_user(user);
        });
        
        handle.send_internal(chat_message);

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
