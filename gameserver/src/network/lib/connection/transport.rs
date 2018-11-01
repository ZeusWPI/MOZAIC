use std::io;
use futures::{Stream, Sink, Poll, Async};

use prost::Message as ProtobufMessage;

use network::lib::channel::Channel;
use network::lib::crypto::{SessionKeys, Encryptor};

use protocol::Packet;
use super::connection_state::ConnectionState;

pub struct Transport {
    channel: Channel,
    last_seq_sent: u32,
    last_ack_sent: u32,
    encryptor: Encryptor
}

impl Transport {
    pub fn new(channel: Channel, keys: SessionKeys, state: &ConnectionState)
        -> Self
    {
        Transport {
            last_seq_sent: state.num_flushed as u32,
            // TODO: what should this value be?
            last_ack_sent: 0,
            encryptor: Encryptor::from_keys(&keys),
            channel,
        }
    }

    pub fn send_messages(&mut self, state: &mut ConnectionState)
        -> Poll<(), io::Error> {
        while self.last_seq_sent < state.pos() as u32 {
            let next_seq = self.last_seq_sent + 1;
            let packet = Packet {
                seq_num: next_seq,
                ack_num: state.num_received,
                data: state.get_message(next_seq),
                // As long as there are still messages, we should not close.
                closing: false,
            };
            try_ready!(self.send_packet(packet));
        }

        // at this point, all packets have been sent

        // if required, send an ack message.
        if self.last_ack_sent < state.num_received {
            try_ready!(self.send_ack(state));
        }

        // if required, send a close message.
        if state.should_close && !state.local_closed {
            try_ready!(self.send_close(state));
        }

        return self.channel.poll_complete();
    }

    fn send_ack(&mut self, state: &mut ConnectionState) -> Poll<(), io::Error> {
        let ack = Packet {
            seq_num: self.last_seq_sent,
            ack_num: state.num_received,
            data: Vec::new(),
            closing: false,
        };
        return self.send_packet(ack);
    }

    fn send_close(&mut self, state: &mut ConnectionState)
        -> Poll<(), io::Error>
    {
        let close = Packet {
            seq_num: self.last_seq_sent,
            ack_num: state.num_received,
            data: Vec::new(),
            closing: true,
        };
        try_ready!(self.send_packet(close));
        state.local_closed = true;
        return Ok(Async::Ready(()));
    }

    fn send_packet(&mut self, packet: Packet) -> Poll<(), io::Error> {
        try_ready!(self.channel.poll_complete());

        self.last_seq_sent = packet.seq_num;
        self.last_ack_sent = packet.ack_num;

        let mut data_buffer = Vec::with_capacity(packet.encoded_len());
        packet.encode(&mut data_buffer).unwrap();

        let encrypted = self.encryptor.encrypt(&data_buffer);

        let res = try!(self.channel.start_send(encrypted));
        assert!(res.is_ready(), "writing to channel blocked");
        return Ok(Async::Ready(()));
    }

    fn receive_message(&mut self, state: &mut ConnectionState)
        -> Poll<Vec<u8>, io::Error>
    {
        // TODO: this can probably be simplified
        loop {
            let packet = match self.channel.poll().unwrap() {
                Async::NotReady => return Ok(Async::NotReady),
                Async::Ready(None) => bail!(io::ErrorKind::ConnectionAborted),
                Async::Ready(Some(bytes)) => try!(self.decode_packet(&bytes)),
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

                if !packet.data.is_empty() {
                    return Ok(Async::Ready(packet.data));
                }

            } else {
                eprintln!("got out-of-order packet");
            }
        }

    }

    pub fn poll(&mut self, state: &mut ConnectionState)
        -> Poll<Vec<u8>, io::Error>
    {
        try!(self.send_messages(state));
        return self.receive_message(state);
    }

    fn decode_packet(&mut self, bytes: &[u8]) -> io::Result<Packet> {
        let data = try!(self.encryptor.decrypt(bytes));
        let packet = try!(Packet::decode(&data));
        return Ok(packet);
    }
}
