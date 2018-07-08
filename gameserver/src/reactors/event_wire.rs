use futures::{Poll, Async};
use prost::Message;
use bytes::BytesMut;

use protocol as proto;
use network::connection::{Connection, ConnectionEvent};

use super::reactor::WireEvent;


// TODO: oh please find a better name
pub enum EventWireEvent  {
    Connected,
    Disconnected,
    Event(WireEvent),
}

/// An EventWire is used to pass serialized events over the network.
pub struct EventWire {
    // TODO: we probably want to merge these later on
    connection: Connection,
}

impl EventWire {
    pub fn new(connection: Connection) -> Self {
        EventWire {
            connection,
        }
    }

    pub fn poll(&mut self) -> Poll<EventWireEvent, ()> {
        let event = match try_ready!(self.connection.poll()) {
            ConnectionEvent::Connected => {
                EventWireEvent::Connected
            }
            ConnectionEvent::Disconnected => {
                EventWireEvent::Disconnected
            }
            ConnectionEvent::Packet(data) => {
                // TODO: don't crash here
                let raw_event = proto::Event::decode(&data)
                    .expect("invalid event encoding");
                let wire_event = WireEvent {
                    type_id: raw_event.type_id,
                    data: raw_event.data,
                };
                EventWireEvent::Event(wire_event)
            }
        };
        Ok(Async::Ready(event))
    }

    pub fn poll_complete(&mut self) -> Poll<(), ()> {
        return self.connection.poll_complete();
    }

    pub fn send(&mut self, event: WireEvent) {
        let proto_event = proto::Event {
            type_id: event.type_id,
            data: event.data,
        };
        let mut buf = BytesMut::with_capacity(proto_event.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        proto_event.encode(&mut buf).unwrap();
        self.connection.send(buf.to_vec());
    }
}