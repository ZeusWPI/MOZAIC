use futures::{Stream, Sink, Poll, Async};
use prost::Message;
use bytes::BytesMut;

use protocol as proto;
use network::connection::{Connection, ConnectionEvent};
use events::{Connected, Disconnected};

use super::reactor::{SomeEvent, AnyEvent, WireEvent, EventBox};

pub struct EventChannel {
    connection: Connection,
}

impl EventChannel {
    pub fn new(connection: Connection) -> Self {
        EventChannel {
            connection,
        }
    }

    pub fn poll(&mut self) -> Poll<SomeEvent, ()> {
        match try_ready!(self.connection.poll()) {
            ConnectionEvent::Connected => {
                let event_box = EventBox::wrap(Connected {});
                let event = SomeEvent::Event(event_box);
                return Ok(Async::Ready(event));
            }
            ConnectionEvent::Disconnected => {
                let event_box = EventBox::wrap(Disconnected {});
                let event = SomeEvent::Event(event_box);
                return Ok(Async::Ready(event));
            }
            ConnectionEvent::Packet(data) => {
                // TODO: don't crash here
                let raw_event = proto::Event::decode(&data)
                    .expect("invalid event encoding");
                let event = SomeEvent::WireEvent(WireEvent {
                    type_id: raw_event.type_id,
                    data: raw_event.data,
                });
                return Ok(Async::Ready(event));
            }
        }
    }

    pub fn send_event(&mut self, event: SomeEvent) {
        self.send_wire_event(event.into_wire_event());
    }

    fn send_wire_event(&mut self, wire_event: WireEvent) {
        let proto_event = proto::Event {
            type_id: wire_event.type_id,
            data: wire_event.data,
        };
        let mut buf = BytesMut::with_capacity(proto_event.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        proto_event.encode(&mut buf).unwrap();
        self.connection.send(buf.to_vec());
    }
}