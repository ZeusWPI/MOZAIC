pub mod connection_table;
pub mod tcp;
pub mod routing_table;
pub mod handshake;
pub mod router;

pub use self::connection_table::{
    // TODO: why is this in here?
    ClientId,
    ConnectionTable,

};

pub use self::routing_table::{
    RoutingTable,
    RoutingTableHandle,
    RegisteredHandle,
};