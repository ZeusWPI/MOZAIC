// TODO: fix proper error handling, and migrate to 'failure'.
pub mod errors {
    error_chain! {
        foreign_links {
            Io(::std::io::Error);
        }
    }
}

pub mod channel;
pub mod crypto;
pub mod protobuf_codec;
pub mod connection;

pub use self::connection::{
    Connection,
    ConnectionHandler,
    ConnectionHandle,
};
