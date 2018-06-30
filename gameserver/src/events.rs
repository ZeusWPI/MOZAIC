use serde_json;
use serde::ser::Serialize;
use serde::de::DeserializeOwned;
use utils::hex_serializer;

use reactors::reactor::EventType;

pub trait JsonEventType : Serialize + DeserializeOwned {
    const TYPE_ID: u32;
}

impl<T: JsonEventType> EventType for T {
    const TYPE_ID: u32 = T::TYPE_ID;

    fn encode(&self) -> Vec<u8> {
            serde_json::to_vec(self)
                .expect("serialization failed")
        }

    fn decode(bytes: &[u8]) -> Self {
        serde_json::from_slice(&bytes)
            .expect("deserialization failed")
    }
}

#[derive(Serialize, Deserialize)]
pub struct RegisterClient {
    pub client_id: u32,
    #[serde(with="hex_serializer")]
    pub token: Vec<u8>,
}

impl JsonEventType for RegisterClient {
    const TYPE_ID: u32 = 1;
}

#[derive(Serialize, Deserialize)]
pub struct RemoveClient {
    pub client_id: u32,
}

impl JsonEventType for RemoveClient {
    const TYPE_ID: u32 =  2;
}

#[derive(Serialize, Deserialize)]
pub struct StartGame {
    pub map_path: String,
    pub max_turns: u64,
}

impl JsonEventType for StartGame {
    const TYPE_ID: u32 = 3;
}

#[derive(Serialize, Deserialize)]
pub struct ClientConnected {
    pub client_id: u32,
}

impl JsonEventType for ClientConnected {
    const TYPE_ID: u32 = 4;
}

#[derive(Serialize, Deserialize)]
pub struct ClientDisconnected {
    pub client_id: u32,
}

impl JsonEventType for ClientDisconnected {
    const TYPE_ID: u32 = 5;
}

#[derive(Serialize, Deserialize)]
pub struct LeaderConnected {}

impl JsonEventType for LeaderConnected {
    const TYPE_ID: u32 = 10;
}

#[derive(Serialize, Deserialize)]
pub struct LeaderDisconnected {}

impl JsonEventType for LeaderDisconnected {
    const TYPE_ID: u32 = 11;
}

#[derive(Serialize, Deserialize)]
pub struct FollowerConnected {}

impl JsonEventType for FollowerConnected {
    const TYPE_ID: u32 = 12;
}

#[derive(Serialize, Deserialize)]
pub struct FollowerDisconnected {}

impl JsonEventType for FollowerDisconnected {
    const TYPE_ID: u32 = 13;
}
