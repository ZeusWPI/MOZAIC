
#![feature(plugin)]
#![feature(custom_derive)]
#![plugin(rocket_codegen)]

extern crate rocket;
extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use std::io;
use std::path::{Path, PathBuf};
use rocket_contrib::Json;
use rocket::response::NamedFile;
use rocket::response::status;


#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open("index.html")
}

#[get("/<asset..>")]
fn assets(asset: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("dist/").join(asset)).ok()
}

#[derive(Deserialize)]
struct SubscribeForm {
    email: String
}

#[post("/subscribe", format = "application/json", data = "<form>")]
fn subscribe(form: Json<SubscribeForm>) -> status::NoContent<> {
    let form: SubscribeForm = form.into_inner();
    println!("{}", form.email);
    status::NoContent
}

fn main() {
    rocket::ignite().mount("/", routes![index, assets, subscribe]).launch();
}
