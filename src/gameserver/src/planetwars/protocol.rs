use slog;
use erased_serde;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expedition {
    pub id: u64,
    pub ship_count: u64,
    pub origin: String,
    pub destination: String,
    pub owner: u64,
    pub turns_remaining: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Planet {
    pub ship_count: u64,
    pub x: f64,
    pub y: f64,
    pub owner: Option<u64>,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Action {
    #[serde(rename = "moves")]
    pub commands: Vec<Command>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameInfo {
    pub players: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub origin: String,
    pub destination: String,
    pub ship_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Map {
    pub planets: Vec<Planet>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct State {
    pub planets: Vec<Planet>,
    pub expeditions: Vec<Expedition>,
}

impl slog::Value for State {
    fn serialize(&self,
             _record: &slog::Record,
             key: slog::Key,
             serializer: &mut slog::Serializer)
             -> slog::Result
    {
        serializer.emit_serde(key, self)
    }
}

impl slog::SerdeValue for State {
    fn as_serde(&self) -> &erased_serde::Serialize {
        self
    }

    fn to_sendable(&self) -> Box<slog::SerdeValue + Send + 'static> {
        Box::new(self.clone())
    }
}