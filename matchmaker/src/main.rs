#![feature(plugin)]
#![plugin(rocket_codegen)]

#![feature(rustc_private)]
extern crate rand;

extern crate rocket;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;


use rocket_contrib::{Json, Value};

use rocket::response::content;
use rocket::State;

use std::collections::HashMap;
use std::u32;

use std::sync::Mutex;

type Id = u32;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapInfo {
    name: String,
    id: Id,
    max_players: u32,
}

struct Map {
    planets: Vec<Planet>,
}

struct Planet {
    name: String,
    x: i64,
    y: i64,
    owner: u64,
    ship_count: u64,
}

#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    id: Id,
    // maybe auth information or something
}

#[derive(Serialize, Deserialize)]
struct Lobby {
    map_id: Id,
    max_players: u32,
    lobby_id: Id,
    connected_players: Vec<User>,
    connecting_players: Vec<Id>,
}

impl Lobby {
    fn new(map_id: Id, max_players: u32) -> (Lobby, Id) {
        let lobby_id = rand::random();
        let player_ids = (0..max_players).map(|_| rand::random()).collect();
        (Lobby {
            map_id,
            max_players,
            lobby_id,
            connected_players: Vec::new(),
            connecting_players: player_ids,
        }, lobby_id)
    }
}

struct AskLobby {
    map_id: Id,

}

type LobbyState = HashMap<Id, Lobby>;
type MapState = HashMap<Id, Map>;

#[post("/games", data="<map_info>")]
fn post_lobby(map_info: Json<MapInfo>, map_state: State<Mutex<MapState>>, lobby_state: State<Mutex<LobbyState>>) -> Result<Json<Id>, String> {
    let mut l_state = lobby_state.lock().unwrap();
    let m_state = map_state.lock().unwrap();

    // check if map is in db ish
    if m_state.contains_key(&map_info.0.id) {
        let (lobby, id) = Lobby::new(map_info.0.id, map_info.0.max_players);
        l_state.insert(id, lobby);
        Ok(Json(id))
    } else {
        Err("Map not found".to_string())
    }
}

#[get("/")]
fn json() -> content::Json<&'static str> {
    content::Json("{ 'hi': 'world' }")
}

#[get("/")]
fn index() -> &'static str {
    "Hello, world!"
}

#[derive(Serialize, Deserialize)]
struct Message {
   contents: String,
}

#[put("/<id>", data = "<message>")]
fn update(id: u64, message: Json<Message>) -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

fn main() {
    let l_state: Mutex<LobbyState> = Mutex::new(HashMap::new());
    let m_state: Mutex<MapState> = Mutex::new(HashMap::new());
    rocket::ignite()
    .manage(l_state)
    .manage(m_state)
    .mount("/", routes![json, update]).launch();
}