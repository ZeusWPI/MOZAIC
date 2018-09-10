use reactors::WireEvent;
use protocol::packet::Payload;
use protocol::{Packet, Request, Response, CloseRequest};

#[derive(Debug)]
pub enum ConnectionStatus {
    /// operating normally
    Open,
    /// We are requesting to close the connection
    RequestingClose,
    /// Remote party is requsting to close the connection,
    RemoteRequestingClose,
    /// The connection is considered closed
    Closed,
}

pub struct ConnectionState {
    pub status: ConnectionStatus,
    /// how many packets have been flushed from the buffer
    pub num_flushed: usize,

    /// how many messages we already received
    pub num_received: u32,

    /// Send buffer
    pub buffer: Vec<Payload>,
}

impl ConnectionState {
    pub fn new() -> Self {
        ConnectionState {
            status: ConnectionStatus::Open,
            num_flushed: 0,
            num_received: 0,
            buffer: Vec::new(),
        }
    }

    pub fn pos(&self) -> usize {
        self.num_flushed + self.buffer.len()
    }

    pub fn get_message(&self, seq_num: u32) -> Payload {
        // TODO: can this clone be avoided?
        self.buffer[seq_num as usize - self.num_flushed - 1].clone()
    }

    pub fn send_request(&mut self, wire_event: WireEvent) -> u32 {
        self.buffer_message(Payload::Request(
            Request {
                type_id: wire_event.type_id,
                data: wire_event.data,
            }
        ));
        return self.pos() as u32;
    }

    pub fn send_response(&mut self, response: Response) {
        self.buffer_message(Payload::Response(response))
    }

    pub fn send_close_request(&mut self) {
        self.buffer_message(Payload::CloseRequest(CloseRequest {}));
    }

    pub fn request_close(&mut self) {
        match self.status {
            ConnectionStatus::Open => {
                self.status = ConnectionStatus::RequestingClose;
                self.send_close_request();
            }
            ConnectionStatus::RemoteRequestingClose => {
                self.status = ConnectionStatus::Closed;
                self.send_close_request();
            }
            _ => {
                panic!("Calling request_close in illegal state");
            }
        }
    }

    pub fn receive(&mut self, packet: &Packet) {
        self.num_received = packet.seq_num;

        let mut ack_num = packet.ack_num as usize;

        if ack_num > self.pos() {
            eprintln!("Got ack for packet that was not sent yet");
            ack_num = self.pos();
        }

        if ack_num > self.num_flushed {
            self.buffer.drain(0..(ack_num - self.num_flushed));
            self.num_flushed = ack_num;
        }
    }

    fn buffer_message(&mut self, payload: Payload) {
        self.buffer.push(payload);
    }
}
