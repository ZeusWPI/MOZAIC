extern crate mozaic;
extern crate sodiumoxide;
extern crate hex;
extern crate tokio;
extern crate futures;
extern crate prost;

use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

use futures::Future;


use std::net::SocketAddr;
use tokio::prelude::Stream;
use tokio::net::TcpStream;
use mozaic::net::{StreamHandler, Writer, MsgHandler};
use mozaic::network_capnp::{connect};


fn main() {

    let addr = "127.0.0.1:9142".parse().unwrap();
    let task = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(|stream| {
            let mut h = mozaic::net::StreamHandler::new((), stream);
            h.writer().write(connect::Owned, |b| {
                let mut m: connect::Builder = b.init_as();
                m.
            });
            h
    });

    tokio::run(task);
}