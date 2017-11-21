use planetwars::protocol as proto;
use planetwars::controller::CommandError;

#[derive(Serialize, Deserialize)]
pub struct Event {
    pub timestamp: (), // TODO: fix type
    pub event: EventValue,
}

#[derive(Serialize, Deserialize)]
pub enum EventValue {
    Message(Message),
    Disconnect(String),
}

#[derive(Serialize, Deserialize)]
pub struct Message {
    pub raw_content: String,
    pub value: MessageValue,
}

#[derive(Serialize, Deserialize)]
pub enum MessageValue {
    Content(Action),
    Error(String),
}

#[derive(Serialize, Deserialize)]
pub struct Action {
    pub commands: Vec<Command>,
}

#[derive(Serialize, Deserialize)]
pub struct Command {
    pub command: proto::Command,
    pub error: Option<CommandError>,
}
