use hex;
use serde::ser::Serializer;
use serde::de::{Deserialize, Deserializer};
use serde::de::Error as DeserializationError;


pub fn serialize<T, S>(buffer: &T, serializer: S) -> Result<S::Ok, S::Error>
  where T: AsRef<[u8]>,
        S: Serializer
{
    let s = hex::encode(buffer);
    return serializer.serialize_str(&s);
}

pub fn deserialize<'de, D>(deserializer: D) -> Result<Vec<u8>, D::Error>
    where D: Deserializer<'de>
{
    let s: &str = try!(Deserialize::deserialize(deserializer));
    return hex::decode(s).map_err(D::Error::custom);
}
