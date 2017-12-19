use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use client_controller::{ClientMessage, Message};
use planetwars::config::Config;
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
               client_msgs: UnboundedReceiver<ClientMessage>,
               conf: Config,)
               -> Self
    {


        // let game_info = proto::GameInfo {
        //     players: player_names,
        // };

        let log_file = File::create("log.json").unwrap();
        
        let logger = slog::Logger::root( 
            Mutex::new(slog_json::Json::default(log_file)).map(slog::Fuse),
            o!()
        );

        let mut c = Controller {
            pw_controller: PwController::new(conf, clients, logger.clone()),
            step_lock: StepLock::new(),
            client_msgs,
            logger,
        };
        c.init();
        return c;
    }

    fn init(&mut self) {
        self.pw_controller.init(&mut self.step_lock);
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
                self.handle_command(client_id, msg);
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

    fn handle_command(&mut self, client_id: usize, msg: String) {
        self.step_lock.attach_command(client_id, msg);
        if self.step_lock.is_ready() {
            let msgs = self.step_lock.take_messages();
            self.pw_controller.step(&mut self.step_lock, msgs);
        }
    }
}

impl Future for Controller {
    type Item = Vec<usize>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<usize>, ()> {
        self.pw_controller.init(&mut self.step_lock);
        loop {
            let msg = try_ready!(self.client_msgs.poll()).unwrap();
            self.handle_message(msg.client_id, msg.message);

            if let Some(result) = self.pw_controller.outcome() {
                return Ok(Async::Ready(result));
            }
        }

    }
}
