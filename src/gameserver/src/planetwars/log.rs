use planetwars::protocol as proto;
use planetwars::controller::CommandError;

pub enum Message {
    Valid {
        content: String,
        action: Action,
    },
    Invalid {
        content: String,
        error: (),
    },
    Terminated,
}

pub struct Action {
    pub commands: Vec<Command>,
}

pub struct Command {
    pub command: proto::Command,
    pub error: Option<CommandError>,
}
