extern crate prost_build;
extern crate mozaic_build;

use std::env;

fn main() {
    prost_build::compile_protos(
        &["../proto/core.proto"],
        &["../proto"]
    ).unwrap();
    // env::set_var("OUT_DIR", "./src/protos");
    mozaic_build::compile_events(
        "../proto/events.toml",
        "../proto",
        "../proto/events.proto",
    ).unwrap();
}