pub struct Connection {
    id: u64,
}

pub struct ConnectionHandle {
}

impl ConnectionHandle {
    pub fn receive(&mut self, data: Vec<u8>) {
        unimplemented!()
    }
}