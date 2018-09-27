// TODO: fix proper error handling, and migrate to 'failure'.
pub mod errors {
    error_chain! { }
}

pub mod channel;
pub mod crypto;
pub mod protobuf_codec;
pub mod connection_handler;

pub use self::connection_handler::{ConnectionHandler, ConnectionHandle};
