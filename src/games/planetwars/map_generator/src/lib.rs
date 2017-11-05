#[macro_use] 
extern crate itertools;
extern crate rand;
extern crate num;
#[macro_use]
extern crate serde_derive;
extern crate serde_json;
extern crate serde;


mod config;
mod util;
mod map_generator;
mod types;

pub use config::Config;
pub use types::Map;
pub use map_generator::create_map;