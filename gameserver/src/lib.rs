#![allow(dead_code)]

extern crate bytes;
extern crate hex;

extern crate tokio_core;
extern crate tokio_io;
extern crate tokio_process;
extern crate tokio;
extern crate tokio_timer;
extern crate tokio_codec;
#[macro_use]
extern crate futures;
extern crate rand;

extern crate serde;
extern crate serde_json;
extern crate erased_serde;
#[macro_use]
extern crate error_chain;

#[macro_use]
extern crate serde_derive;

extern crate prost;
#[macro_use]
extern crate prost_derive;
#[macro_use]
extern crate mozaic_derive;
extern crate sodiumoxide;

pub mod network;
pub mod planetwars;
pub mod utils;
pub mod reactors;
pub mod server;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
}

pub mod events {
    include!(concat!(env!("OUT_DIR"), "/mozaic.events.rs"));
}
