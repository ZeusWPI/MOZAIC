
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
use rocket::response::status;
use rocket::http::Status;
use rocket::Outcome;
use rocket::Response;
use rocket::request::{self, Request, FromRequest};

static EMAIL_FILE: &'static str = "emails.txt";
static CMD_AGENTS: &'static [&'static str] = &["Wget", "curl", "HTTPie"];

struct UserAgent(Option<String>);

impl<'a, 'r> FromRequest<'a, 'r> for UserAgent {
    type Error = ();

    fn from_request(request: &'a Request<'r>) -> request::Outcome<UserAgent, ()> {
        let keys: Vec<_> = request.headers().get("user-agent").collect();
        let user_agent = keys.get(0).map(|k| k.to_string());
        return Outcome::Success(UserAgent(user_agent));
    }
}


#[get("/")]
fn index(user_agent: UserAgent) -> io::Result<NamedFile> {
    let UserAgent(ua) = user_agent;
    let is_cmdline = match ua {
        Some(agent_str) => CMD_AGENTS.iter().any(|a| agent_str.starts_with(a)),
        _ => false,
    };
    if is_cmdline {
        NamedFile::open("index.txt")
    } else {
        NamedFile::open("index.html")
    }
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
        Err(_err) => {
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
