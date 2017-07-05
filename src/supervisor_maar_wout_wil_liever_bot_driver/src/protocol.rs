#[derive(Serialize, Deserialize)]
struct Expedition {
    ship_count: u64,
    origin: String,
    destination: String,
    owner: String,
    turns_remaining: i64,
}

#[derive(Serialize, Deserialize)]
struct Planet {
    ship_count: u64,
    x: f64,
    y: f64,
    owner: String,
    name: String,
}

type Players = String[];
type Planets = Planet[];
type Expeditions = expeditions[];