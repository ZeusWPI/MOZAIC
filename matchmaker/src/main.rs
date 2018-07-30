#![feature(plugin)]
#![plugin(rocket_codegen)]

#![feature(rustc_private)]
extern crate rand;

extern crate rocket;
extern crate serde_json;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;


use rocket_contrib::{Json, Value};

use rocket::response::{Redirect, content, NamedFile};
use rocket::State;

use std::collections::HashMap;
use std::u32;
use std::path::{Path, PathBuf};
use std::fs::File;
use std::fs;
use std::io::prelude::*;
use serde_json::{ser, Error};

use std::sync::Mutex;
use std::string::String;

type Id = u32;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapInfo {
    name: String,
    id: Id,
    max_players: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Map {
    planets: Vec<Planet>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Planet {
    name: String,
    x: i64,
    y: i64,
    owner: Option<u64>,
    ship_count: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct User {
    name: String,
    id: Id,
    // maybe auth information or something
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Lobby {
    map_id: Id,
    max_players: u32,
    lobby_id: Id,
    connected_players: Vec<User>,
    awaiting_players: Vec<Id>,
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
            awaiting_players: player_ids,
        }, lobby_id)
    }

    fn join(&mut self, user: User) -> Result<Id, String> {
        match self.awaiting_players.pop() {
            Some(id) => {
                self.connected_players.push(user);
                Ok(id)
            },
            None => Err(String::from("No places left")),
        }
    }

    fn ready(& self) -> Json<Value> {
        if self.awaiting_players.is_empty() {
            Json(json!({
                "ready": true
            }))
        } else {
            Json(json!({
                "ready": false
            }))
        }
    }
}

struct AskLobby {
    map_id: Id,

}

type LobbyState = HashMap<Id, Lobby>;
type MapState = HashMap<Id, Map>;

#[get("/")]
fn index() -> Redirect {
    Redirect::to("/index.html")
}

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

#[post("/maps/<id>", data="<map>")]
fn post_map(id: u32, map: String, map_state: State<Mutex<MapState>>) -> Result<String, String> {
    let parse_res: Result<Map, Error> = serde_json::from_str(&map);
    match parse_res {
        Ok(map) => {
            let mut m_state = map_state.lock().unwrap();
            if m_state.contains_key(&id) {
                Err("Map_id already excists".to_string())
            } else {
                let out = write_map(id, &map)
                    .map(|_| "Map Added".to_string())
                    .map_err(|e|  format!("{:?}", e));
                m_state.insert(id, map);
                out
            }
        },
        Err(_) => Err("Could not parse map".to_string()),
    }
}

#[post("/lobby/<id>", data="<user>")]
fn join_lobby(id: u32, user: Json<User>, slobby: State<Mutex<LobbyState>>) -> Result<String, String> {
    let mut slobby = slobby.lock().unwrap();

    match slobby.get_mut(&id) {
        Some(lobby) => lobby.join(user.0).map(|x| x.to_string()),
        None => Err(String::from("Lobby not found")),
    }
}

#[get("/lobby/<id>")]
fn lobby_is_ready(id: Id, slobby: State<Mutex<LobbyState>>) -> Result<Json<Value>, String> {
    let slobby = slobby.lock().unwrap();
    match slobby.get(&id) {
        Some(lobby) => Ok(lobby.ready()),
        None => Err(String::from("Lobby not found")),
    }
}

fn write_map(id: u32, map: &Map) -> std::io::Result<()> {
    fs::create_dir("maps")?;
    let mut file = File::create(format!("maps/{}.map", id))?;
    file.write_all(&ser::to_string(map).unwrap().as_bytes())?;
    Ok(())
}

#[get("/lobby")]
fn get_lobbies(state: State<Mutex<LobbyState>>) -> Json<Vec<Lobby>> {
    let state = state.lock().unwrap();
    Json(state.values().map(|x| x.clone()).collect())
}

#[get("/")]
fn json() -> content::Json<&'static str> {
    content::Json("{ 'hi': 'world' }")
}

#[get("/<file..>", rank=4)]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("static/").join(file)).ok()
}

fn fill_maps(state: &mut MapState) -> std::io::Result<()>{
    for entry in Path::new("maps/").read_dir()? {
        if let Ok(map) = entry {
            match map.file_name().into_string()
                .map_err(|_| "Something happend".to_string())
                {

                Ok(name) => {
                    match name.split(|x| x == '.').next() {
                        Some(id_str) => {add_map(&name, id_str, state).unwrap();},
                        None => println!("file has no extension {:?}", name),
                    }
                },
                Err(e) => println!("{:?}", e)
            }
        }
    }
    Ok(())
}

fn add_map(file_name: &str, name: &str, state: &mut MapState) -> std::io::Result<()> {
    if let Ok(id) = name.parse::<u32>() {
        let mut f_name = String::from("maps/");
        f_name.push_str(file_name);
        let mut f = File::open(f_name)?;
        let mut buffer = String::new();

        f.read_to_string(&mut buffer)?;

        let map: Map  = serde_json::from_str(&buffer).unwrap();
        println!("added map {:?} to id {:?}", map, id);
        state.insert(id, map);
    }else{
        println!("couldn't parse id: {:?}", name);
    }
    Ok(())
}

fn main() {
    let mut m_state = HashMap::new();
    fill_maps(&mut m_state);
    let l_state: Mutex<LobbyState> = Mutex::new(HashMap::new());
    rocket::ignite()
    .manage(l_state)
    .manage(Mutex::new(m_state))
    .mount("/", routes![files, post_map, post_lobby, get_lobbies, join_lobby, lobby_is_ready, index]).launch();
}