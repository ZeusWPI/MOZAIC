pub struct Packet {
    pub connection_id: u64,
    pub transport_id: u64,
    pub data: Vec<u64>,
}