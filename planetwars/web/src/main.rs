
#![feature(plugin)]
#![feature(custom_derive)]
#![plugin(rocket_codegen)]

extern crate rocket;
extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use std::io;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::fs::OpenOptions;
use rocket_contrib::Json;
use rocket::response::NamedFile;
use rocket::response::Failure;
use rocket::response::status;
use rocket::Response;
use rocket::http::Status;

static EMAIL_FILE: &'static str = "emails.txt";


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
fn subscribe<'r>(form: Json<SubscribeForm>) -> Result<status::NoContent<>, Response<'r>> {
    let form: SubscribeForm = form.into_inner();
    let resp = match save_email(form.email) {
        Ok(_) => Ok(status::NoContent),
        Err(err) => {
            let err = Response::build()
                .status(Status::InternalServerError)
                .finalize();
            Err(err)
        }
    };
    resp
}

fn save_email(email: String) -> io::Result<()> {
    let mut file = OpenOptions::new()
        .write(true)
        .append(true)
        .open(EMAIL_FILE)?;
    println!("{}", email);
    writeln!(file, "{}", email)
}

fn main() {
    rocket::ignite().mount("/", routes![index, assets, subscribe]).launch();
}
