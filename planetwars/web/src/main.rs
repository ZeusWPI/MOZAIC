
#![feature(plugin)]
#![plugin(rocket_codegen)]

use std::io;
use std::path::{Path, PathBuf};

use rocket::response::NamedFile;

extern crate rocket;

#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open("index.html")
}

#[get("/<asset..>")]
fn assets(asset: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("dist/").join(asset)).ok()
}

fn main() {
    rocket::ignite().mount("/", routes![index, assets]).launch();
}
