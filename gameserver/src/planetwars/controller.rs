use std::collections::{HashMap, HashSet};

use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use client_controller::{ClientMessage, Message};
use planetwars::lock::Lock;
use planetwars::game_controller::GameController;
use planetwars::time_out::Timeout;
use std::marker::PhantomData;
use std::process;

use serde::de::DeserializeOwned;

use slog;

/// The controller forms the bridge between game rules and clients.
/// It is responsible for communications, the control flow, and logging.
pub struct Controller<G: GameController<C>, L: Lock<G, C>, C: DeserializeOwned>
{
    phantom_game_controller: PhantomData<G>,
    phantom_config: PhantomData<C>,
    lock: L,
    client_msgs: UnboundedReceiver<ClientMessage>,
    logger: slog::Logger,
    timeout: Timeout,
    player_names: HashMap<PlayerId, String>,
}

#[derive(PartialEq, Clone, Copy, Eq, Hash, Serialize, Deserialize, Debug)]
pub struct PlayerId {
    id: usize,
}

impl PlayerId {
    pub fn new(id: usize) -> PlayerId {
        PlayerId {
            id
        }
    }

    pub fn as_usize(&self) -> usize {
        self.id
    }
}

impl slog::KV for PlayerId {
    fn serialize(&self,
                 _record: &slog::Record,
                 serializer: &mut slog::Serializer)
                 -> slog::Result
    {
        serializer.emit_usize("player_id", self.as_usize())
    }
}


#[derive(Clone)]
pub struct Client {
    pub id: PlayerId,
    pub player_name: String,
    pub handle: UnboundedSender<String>,
}

impl Client {
    pub fn send_msg(&mut self, msg: String) {
        // unbounded channels don't fail
        self.handle.unbounded_send(msg).unwrap();
    }
}

impl<G, L, C> Controller<G, L, C> 
    where G: GameController<C>, L: Lock<G, C>, C: DeserializeOwned
{
    // TODO: this method does both controller initialization and game staritng.
    // It would be nice to split these.
    pub fn new(clients: Vec<Client>,
               client_msgs: UnboundedReceiver<ClientMessage>,
               conf: C, mut timeout: Timeout, logger: slog::Logger,)
               -> Controller<G, L, C>
    {
        let mut player_ids = HashSet::new();
        player_ids.extend(clients.iter().map(|c| c.id.clone()));
        
        // initial connection timeout starts at 1 minute
        timeout.set_timeout(60000);
        
        Controller {
            player_names: clients.iter().map(|c| (c.id, c.player_name.clone())).collect(),
            phantom_game_controller: PhantomData,
            phantom_config: PhantomData,
            lock: Lock::new(GameController::new(conf, clients, logger.clone()), player_ids),
            client_msgs,
            logger,
            timeout,
        }
    }

    /// Handle an incoming message.
    fn handle_message(&mut self, player_id: PlayerId, msg: Message) {
        match msg {
            Message::Data(msg) => {
                // TODO: maybe it would be better to log this in the
                // client_controller.
                info!(self.logger, "message received";
                    player_id,
                    "content" => &msg,
                );
                self.lock.attach_command(player_id, msg);
            },
            Message::Disconnected => {
                // TODO: should a reason be included here?
                // It might be more useful to have the client controller log
                // disconnect reasons.
                info!(self.logger, "client disconnected";
                    player_id
                );
                self.lock.disconnect(player_id);
            },
            Message::Connected => {
                info!(self.logger, "client connected";
                    player_id
                );
                self.lock.connect(player_id);
            },
            Message::Timeout => {
                if self.timeout.is_expired() {
                    if let Some(player_id) = self.lock.get_waiting().into_iter().next() {
                        eprintln!("[GAMESERVER] bot \"{}\" timed out.", self.player_names[&player_id]);
                        eprintln!("[GAMESERVER] Game terminating; all other bots will now be killed.");
                        process::exit(1);
                    }

                    // self.lock.do_time_out();
                    // self.force_lock_step();
                    // self.run_lock();
                }
            }
        }
    }

    /// Sets new timeout future
    fn start_time_out(&mut self, time: u64) {
        self.timeout.set_timeout(time);
    }

    /// Steps the lock step 1 step, and sets a new timeout
    fn force_lock_step(&mut self) -> Option<Poll<Vec<PlayerId>, ()>> {
        let (time_out, maybe_result) = self.lock.do_step();
        self.start_time_out(time_out);

        if let Some(result) = maybe_result {
            return Some(Ok(Async::Ready(result)));
        }

        None
    }

    /// Steps the lock while ready, or until the game finishes
    fn run_lock(&mut self) -> Option<Poll<Vec<PlayerId>, ()>> {
        while self.lock.is_ready() {
            if let Some(re) = self.force_lock_step() {
                return Some(re);
            }
        }
        None
    }
}

impl<G, L, C> Future for Controller<G, L, C>
    where G:GameController<C>, L: Lock<G, C>, C: DeserializeOwned
{
    type Item = Vec<PlayerId>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<PlayerId>, ()> {
        loop {
            if let Some(result) = self.run_lock() {
                println!("ended {:?}", result);
                return result;
            }

            let msg = try_ready!(self.client_msgs.poll()).unwrap();
            self.handle_message(msg.player_id, msg.message);
        }
    }
}
