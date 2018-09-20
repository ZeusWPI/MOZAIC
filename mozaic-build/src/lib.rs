extern crate toml;
extern crate prost_build;
extern crate serde;
#[macro_use]
extern crate serde_derive;

use std::fs::File;
use std::collections::HashMap;
use std::io::{Result, Read};


#[derive(Serialize, Deserialize, Debug)]
struct MozaicProtocol {
    events: HashMap<String, u32>
}

pub fn compile_events(manifest_path: &str, proto_path: &str, events_proto: &str) -> Result<()> {
    let mut f = File::open(manifest_path).expect("file not found");
    let mut contents = String::new();
    f.read_to_string(&mut contents).unwrap();
    let protocol: MozaicProtocol = toml::from_str(&contents).unwrap();

    let mut config = prost_build::Config::new();

    for (event_name, event_id) in protocol.events.iter() {
        config.type_attribute(event_name, "#[derive(MozaicEvent)]");
        config.type_attribute(
            event_name,
            format!("#[mozaic_event(type_id=\"{}\")]", event_id)
        );
    }
    

    config.compile_protos(
        &[events_proto],
        &[proto_path]
    )?;
    return Ok(());
}