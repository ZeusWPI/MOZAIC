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
pub struct Connected {}

impl JsonEventType for Connected {
    const TYPE_ID: u32 = 2;
}

#[derive(Serialize, Deserialize)]
pub struct Disconnected {}

impl JsonEventType for Disconnected {
    const TYPE_ID: u32 = 3;
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