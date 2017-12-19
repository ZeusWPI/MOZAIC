use std::collections::{HashSet, HashMap};
use std::mem;

use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use client_controller::{ClientMessage, Message};
use planetwars::config::Config;
use planetwars::rules::{PlanetWars, Dispatch};
use planetwars::step_lock::StepLock;
use planetwars::pw_controller::PwController;

use slog;
use slog::Drain;
use slog_json;
use std::sync::Mutex;

use std::fs::File;

/// The controller forms the bridge between game rules and clients.
/// It is responsible for communications, the control flow, and logging.
pub struct Controller {
    step_lock: StepLock,
    pw_controller: PwController,

    client_msgs: UnboundedReceiver<ClientMessage>,
    logger: slog::Logger,
}


#[derive(Clone)]
pub struct Client {
    pub id: usize,
    pub player_name: String,
    pub handle: UnboundedSender<String>,
}

impl Controller {
    // TODO: this method does both controller initialization and game staritng.
    // It would be nice to split these.
    pub fn new(clients: Vec<Client>,
               chan: UnboundedReceiver<ClientMessage>,
               conf: Config,)
               -> Self
    {


        let mut client_handles = HashMap::new();
        let mut player_names = Vec::new();

        let client_len = clients.len();
        for client in clients.into_iter() {
            client_handles.insert(client.id, client.handle);
            player_names.push(client.player_name);
        }

        // let game_info = proto::GameInfo {
        //     players: player_names,
        // };

        let log_file = File::create("log.json").unwrap();
        
        let logger = slog::Logger::root( 
            Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
            o!()
        );

        let mut controller = Controller {
            logger: logger,
            pw_controller: PwController::new(conf, clients),
            client_msgs: chan,
            step_lock: StepLock::new(),
        };
        // TODO
        // controller.prompt_players();
        return controller;
    }


    /// Handle an incoming message.
    fn handle_message(&mut self, client_id: usize, msg: Message) {
        match msg {
            Message::Data(msg) => {
                // TODO: maybe it would be better to log this in the
                // client_controller.
                info!(self.logger, "message received";
                    "client_id" => client_id,
                    "content" => &msg,
                );

                self.step_lock.attach_command(client_id, msg);
            },
            Message::Disconnected => {
                // TODO: should a reason be included here?
                // It might be more useful to have the client controller log
                // disconnect reasons.
                info!(self.logger, "client disconnected";
                    "client_id" => client_id
                );
                // TODO: handle this case gracefully
                panic!("CLIENT {} disconnected", client_id);
            }
        }
    }
}

impl Future for Controller {
    type Item = Vec<usize>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<usize>, ()> {
        let mut result = None;
        while result.is_none() {
            let msg = try_ready!(self.client_msgs.poll()).unwrap();
            self.handle_message(msg.client_id, msg.message);
            if self.step_lock.is_ready() {
                let msgs = self.step_lock.take_messages();
                result = self.pw_controller.step(&mut self.step_lock, msgs);
            }
        }
        Ok(Async::Ready(result.unwrap()))
    }
}
