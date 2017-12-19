#[derive(Debug, Serialize, Deserialize)]
pub struct Expedition {
    pub id: u64,
    pub ship_count: u64,
    pub origin: String,
    pub destination: String,
    pub owner: u64,
    pub turns_remaining: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Planet {
    pub ship_count: u64,
    pub x: f64,
    pub y: f64,
    pub owner: Option<u64>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct State {
    pub planets: Vec<Planet>,
    pub expeditions: Vec<Expedition>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameInfo {
    pub players: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Command {
    pub moves: Vec<Move>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Move {
    pub origin: String,
    pub destination: String,
    pub ship_count: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Map {
    pub planets: Vec<Planet>,
}
