#[derive(Serialize, Deserialize)]
pub struct Expedition {
    pub id: u64,
    pub ship_count: u64,
    pub origin: PlanetName,
    pub destination: PlanetName,
    pub owner: String,
    pub turns_remaining: u64,
}

#[derive(Serialize, Deserialize)]
pub struct Planet {
    pub ship_count: u64,
    pub x: f64,
    pub y: f64,
    pub owner: Option<String>,
    pub name: PlanetName,
}

#[derive(Serialize, Deserialize)]
pub struct State {
    pub players: Vec<String>,
    pub planets: Vec<Planet>,
    pub expeditions: Vec<Expedition>,
}

#[derive(Serialize, Deserialize)]
pub struct Command {
    #[serde(rename="move")]
    pub value: Option<Move>,
}

#[derive(Serialize, Deserialize)]
pub struct Move {
    pub origin: PlanetName,
    pub destination: PlanetName,
    pub ship_count: u64,
}

pub type PlanetName = String;
