#![allow(dead_code)]
#![feature(arbitrary_self_types)]

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
extern crate sodiumoxide;
extern crate capnp;

pub mod network;
pub mod messaging;
// pub mod utils;
// pub mod reactors;

pub mod protocol {
    include!(concat!(env!("OUT_DIR"), "/mozaic.protocol.rs"));
}

pub mod core_capnp {
    include!(concat!(env!("OUT_DIR"), "/core_capnp.rs"));
}

pub mod network_capnp {
    include!(concat!(env!("OUT_DIR"), "/network_capnp.rs"));
}