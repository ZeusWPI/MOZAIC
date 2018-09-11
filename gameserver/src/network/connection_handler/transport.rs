use std::io;
use futures::{Stream, Sink, Poll, Async};

use prost::Message as ProtobufMessage;

use network::tcp::Channel;
use protocol::Packet;
use protocol::packet::Payload;
use super::connection_state::ConnectionState;


pub struct NetworkMessage {
    pub seq_num: u32,
    pub payload: Payload,
}

pub struct Transport {
    channel: Channel,
    last_seq_sent: u32,
    last_ack_sent: u32,
}

impl Transport {
    pub fn new(channel: Channel, state: &ConnectionState)
        -> Self
    {
        Transport {
            last_seq_sent: state.num_flushed as u32,
            // TODO: what should this value be?
            last_ack_sent: 0,
            channel,
        }
    }

    pub fn send_messages(&mut self, state: &mut ConnectionState)
        -> Poll<(), io::Error> {
        while self.last_seq_sent < state.pos() as u32 {
            let next_seq = self.last_seq_sent + 1;
            let payload = state.get_message(next_seq);
            let packet = Packet {
                seq_num: next_seq,
                ack_num: state.num_received,
                payload: Some(payload),
            };
            try_ready!(self.send_packet(packet));
        }

        if self.last_ack_sent < state.num_received {
            try_ready!(self.send_ack(state));
        }

        return self.channel.poll_complete();
    }

    fn send_ack(&mut self, state: &mut ConnectionState) -> Poll<(), io::Error> {
        let ack = Packet {
            seq_num: self.last_seq_sent,
            ack_num: state.num_received,
            payload: None,
        };
        return self.send_packet(ack);
    }

    fn send_packet(&mut self, packet: Packet) -> Poll<(), io::Error> {
        try_ready!(self.channel.poll_complete());
        self.last_seq_sent = packet.seq_num;
        self.last_ack_sent = packet.ack_num;

        let mut bytes = Vec::with_capacity(packet.encoded_len());
        // encoding can only fail because the buffer does not have
        // enough space allocated, but we just allocated the required
        // space.
        packet.encode(&mut bytes).unwrap();

        let res = try!(self.channel.start_send(bytes));
        assert!(res.is_ready(), "writing to channel blocked");
        return Ok(Async::Ready(()));
    }

    fn receive_message(&mut self, state: &mut ConnectionState)
        -> Poll<NetworkMessage, io::Error>
    {
        loop {
            let packet = match try_ready!(self.channel.poll()) {
                None => bail!(io::ErrorKind::ConnectionAborted),
                Some(bytes) => try!(Packet::decode(&bytes)),
            };

            // TODO: how should these faulty cases be handled?
            // TODO: maybe this logic should be moved to ConnectionState
            if packet.seq_num < state.num_received {
                eprintln!("got retransmitted packet");
            } else if packet.seq_num == state.num_received {
                // this is an ack packet
                state.receive(&packet);
            } else if packet.seq_num == state.num_received + 1 {
                // this is the next packet in the stream
                state.receive(&packet);
                match packet.payload {
                    Some(payload) => return Ok(Async::Ready(NetworkMessage {
                        seq_num: packet.seq_num,
                        payload,
                    })),
                    None => {
                        eprintln!("packet has no payload");
                    },
                }
            } else {
                eprintln!("got out-of-order packet");
            }
        }

    }

    pub fn poll(&mut self, state: &mut ConnectionState)
        -> Poll<NetworkMessage, io::Error>
    {
        try!(self.send_messages(state));
        return self.receive_message(state);
    }
}

