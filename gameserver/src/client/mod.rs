pub mod runtime;
pub mod server_link;

use std::net::SocketAddr;

use tokio::net::TcpStream;
use futures::Future;

use messaging::reactor::CoreParams;

pub use self::runtime::{Runtime, RuntimeState};
pub use self::server_link::{LinkHandler, ClientParams};

pub fn run_client<F, S>(addr: SocketAddr, init: F)
    where F: Fn(ClientParams) -> CoreParams<S, Runtime> + 'static + Send + Sync,
          S: 'static + Send,
{
    let t = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(move |stream| {
            LinkHandler::new(stream, init)
        });
    tokio::run(t);
}