extern crate mozaic;
extern crate sodiumoxide;
extern crate hex;
extern crate tokio;
extern crate futures;
extern crate prost;

use sodiumoxide::crypto::sign::{PublicKey, SecretKey};

use futures::Future;

use tokio::net::TcpStream;
use mozaic::network::client;
use mozaic::network::lib::ConnectionHandler;
use mozaic::reactors::{WireEvent, RequestHandler};
use mozaic::events;
use mozaic::protocol as proto;
use prost::Message;

fn main() {
    sodiumoxide::init().expect("failed to initialize libsodium");

    let _public_key = PublicKey::from_slice(
        &hex::decode(
            "da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d"
        ).unwrap()
    ).unwrap();
    let secret_key = SecretKey::from_slice(
        &hex::decode(
            "ea0d1f3d3051c83073d1ea77fcd2d5c7058c134d8b2d8291732e0793268c9127da969f456ba9c9565190d8badb1086617b53b2f6a8b0f50872b4cebb9110de9d"
        ).unwrap()
    ).unwrap();

    let addr = "127.0.0.1:9142".parse().unwrap();
    let task = TcpStream::connect(&addr)
        .map_err(|err| panic!(err))
        .and_then(|stream| {
            let (conn_handle, handler) = ConnectionHandler::create(0, |_| {
                println!("succesfully connected");

                let mut core = RequestHandler::new(());
                core.add_handler(|_state, e: &events::Connected| {
                    println!("got connected event");
                    return Ok(WireEvent::null());
                });
                core
            });
            tokio::spawn(handler);
            let (mut handle, driver) = client::tcp::TransportDriver::new(stream);

            let uuid = vec![0u8; 64];

            let connect = proto::GameserverConnect {
                connect: Some(proto::gameserver_connect::Connect::Control(
                    proto::ControlChannelConnect { uuid }
                )),
            };
            let mut message = Vec::with_capacity(connect.encoded_len());
            connect.encode(&mut message).unwrap();
            
            handle.connect(client::tcp::ConnectParams {
                secret_key,
                message,
                conn_handle,
            });

            return driver;
    });

    tokio::run(task);
}