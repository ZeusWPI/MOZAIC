extern crate map_generator;

use std::fs::File;
use std::io::prelude::*;

use map_generator::Config;
use map_generator::create_map;


#[test]
#[allow(unused_must_use)]
fn test_create_map() {
    let config = Config::new();
    let map = create_map(&config);
    match File::create("map.json") {
        Ok(mut file) => {
            file.write_all(format!("{}", map).as_bytes());
            print!("{}", map);
        },
        Err(_) => panic!("test kaput!")
    }
}
