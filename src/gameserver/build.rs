extern crate prost_build;

fn main() {
    prost_build::compile_protos(&["src/client_server.proto"],
                                &["src/"]).unwrap();
}