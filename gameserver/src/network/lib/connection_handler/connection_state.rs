use reactors::WireEvent;
use protocol::Packet;

#[derive(Debug)]
pub enum ConnectionStatus {
    /// operating normally
    Open,

    /// We want to close the connection
    RequestingClose,
    /// We have requested to close the connection
    CloseRequested,

    /// Remote party has requested to close the connection,
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
    pub buffer: Vec<Vec<u8>>,
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

    pub fn get_message(&self, seq_num: u32) -> Vec<u8> {
        // TODO: can this clone be avoided?
        self.buffer[seq_num as usize - self.num_flushed - 1].clone()
    }

    pub fn closing(&self) -> bool {
        match self.status {
            Open => false,
            RequestingClose => self.buffer.is_empty(),
        }
    }

    pub fn remote_closed(&self) -> bool {
        match self.status {
            ConnectionStatus::RemoteRequestingClose => true,
            _ => false,
        }
    }

    pub fn _request_close(&mut self) {
        match self.status {
            ConnectionStatus::Open => {
                self.status = ConnectionStatus::RequestingClose;
            }
            ConnectionStatus::RemoteRequestingClose => {
                self.status = ConnectionStatus::Closed;
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

    fn buffer_message(&mut self, message: Vec<u8>) {
        self.buffer.push(message);
    }
}
