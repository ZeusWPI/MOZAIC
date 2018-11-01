use protocol::Packet;

pub struct ConnectionState {
    // whether the connection should be closed
    pub should_close: bool,
    // whether we have closed the connection
    pub local_closed: bool,
    // whether remote party has closed the connection
    pub remote_closed: bool,

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
            should_close: false,
            local_closed: false,
            remote_closed: false,

            num_flushed: 0,
            num_received: 0,
            buffer: Vec::new(),
        }
    }

    pub fn pos(&self) -> usize {
        self.num_flushed + self.buffer.len()
    }

    pub fn is_closed(&self) -> bool {
        self.local_closed && self.remote_closed
    }

    pub fn get_message(&self, seq_num: u32) -> Vec<u8> {
        // TODO: can this clone be avoided?
        self.buffer[seq_num as usize - self.num_flushed - 1].clone()
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

        if packet.closing {
            self.remote_closed = true;
        }
    }

    fn buffer_message(&mut self, message: Vec<u8>) {
        // no new messages should be sent after we initiate closing
        debug_assert!(!self.should_close);
        self.buffer.push(message);
    }
}
