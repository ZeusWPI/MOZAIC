#[derive(Debug, Serialize, Deserialize)]
pub struct Expedition {
    pub id: u64,
    pub ship_count: u64,
    pub origin: String,
    pub destination: String,
    pub owner: String,
    pub turns_remaining: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Planet {
    pub ship_count: u64,
    pub x: f64,
    pub y: f64,
    pub owner: Option<String>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct State {
    pub players: Vec<String>,
    pub planets: Vec<Planet>,
    pub expeditions: Vec<Expedition>,
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
    pub players: Vec<String>,
    pub planets: Vec<Planet>,
}
