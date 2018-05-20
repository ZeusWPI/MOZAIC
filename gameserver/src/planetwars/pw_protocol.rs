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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInfo {
    pub players: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandError {
    NotEnoughShips,
    OriginNotOwned,
    ZeroShipMove,
    OriginDoesNotExist,
    DestinationDoesNotExist,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerCommand {
    pub command: Command,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<CommandError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type", content = "value")]
pub enum PlayerAction {
    Timeout,
    ParseError(String),
    Commands(Vec<PlayerCommand>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type", content = "content")]
pub enum ServerMessage {
    /// Game state in current turn
    GameState(State),
    /// The action that was performed
    PlayerAction(PlayerAction),
    /// The game is over, and this is the concluding state.
    FinalState(State),
}

// lobby messages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type", content = "content")]
pub enum ControlMessage {
    PlayerConnected {
        player_id: u64,
    },
    PlayerDisconnected {
        player_id: u64,
    },
    GameState(State),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
#[serde(tag = "type", content = "content")]
pub enum LobbyCommand {
    StartMatch,
}

impl slog::Value for Command {
    fn serialize(&self,
                 _record: &slog::Record,
                 key: slog::Key,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_serde(key, self)
    }
}

impl slog::KV for Command {
    fn serialize(&self,
                 _record: &slog::Record,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_serde("command", self)
    }
}

impl slog::SerdeValue for Command {
    fn as_serde(&self) -> &erased_serde::Serialize {
        self
    }

    fn to_sendable(&self) -> Box<slog::SerdeValue + Send + 'static> {
        Box::new(self.clone())
    }
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

impl slog::KV for State {
    fn serialize(&self,
                 _record: &slog::Record,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_serde("state", self)
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


impl slog::Value for GameInfo {
    fn serialize(&self,
                 _record: &slog::Record,
                 key: slog::Key,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_serde(key, self)
    }
}

impl slog::SerdeValue for GameInfo {
    fn as_serde(&self) -> &erased_serde::Serialize {
        self
    }

    fn to_sendable(&self) -> Box<slog::SerdeValue + Send + 'static> {
        Box::new(self.clone())
    }
}