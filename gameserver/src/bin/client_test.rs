extern crate mozaic;
extern crate sodiumoxide;
extern crate hex;
extern crate tokio;
extern crate futures;

use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

use futures::Future;

use tokio::net::TcpStream;
use mozaic::network::client;

fn main() {
    sodiumoxide::init().expect("failed to initialize libsodium");

    let _public_key = PublicKey::from_slice(
        &hex::decode(
            "da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d"
        ).unwrap()
    ).unwrap();
    let _secret_key = SecretKey::from_slice(
        &hex::decode(
            "ea0d1f3d3051c83073d1ea77fcd2d5c7058c134d8b2d8291732e0793268c9127da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d"
        ).unwrap()
    ).unwrap();

    let addr = "127.0.0.1:9142".parse().unwrap();
    let task = TcpStream::connect(&addr).map(|stream| {
        println!("succesfully connected");
        let (_handle, driver) = client::tcp::TransportDriver::new(stream);
        tokio::spawn(driver);
    }).map_err(|err| panic!(err));

    tokio::run(task);
}