extern crate prost_build;

fn main() {
    prost_build::compile_protos(&["../client_server.proto"],
                                &[".."]).unwrap();
}