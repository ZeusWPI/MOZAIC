use std::collections::HashSet;

use futures::{Future, Async, Poll, Stream};
use futures::sync::mpsc::{UnboundedSender, UnboundedReceiver};

use client_controller::{ClientMessage, Message};
use planetwars::lock::Lock;
use planetwars::game_controller::GameController;
use std::marker::PhantomData;

use std::time::Duration;

use tokio_timer::Sleep;
use tokio_timer::Timer;

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
    sleeper: Sleep,
}


#[derive(Clone)]
pub struct Client {
    pub id: usize,
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
               conf: C, logger: slog::Logger,)
               -> Controller<G, L, C>
    {
        let mut client_ids = HashSet::new();
        client_ids.extend(clients.iter().map(|c| c.id));
        Controller {
            phantom_game_controller: PhantomData,
            phantom_config: PhantomData,
            lock: Lock::new(GameController::new(conf, clients, logger.clone()), client_ids),
            client_msgs,
            logger,
            // initial connection timeout starts at 1 minute
            sleeper: Timer::default().sleep(Duration::from_millis(60000)),
        }
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
                self.lock.attach_command(client_id, msg);
            },
            Message::Disconnected => {
                // TODO: should a reason be included here?
                // It might be more useful to have the client controller log
                // disconnect reasons.
                info!(self.logger, "client disconnected";
                    "client_id" => client_id
                );
                self.lock.disconnect(client_id);
            },
            Message::Connected => {
                info!(self.logger, "client connected";
                    "client_id" => client_id
                );
                self.lock.connect(client_id);
            },
        }
    }

    /// Sets new timeout future
    fn start_time_out(&mut self, time: usize) {
        let timer = Timer::default();
        self.sleeper = timer.sleep(Duration::from_millis(time as u64));
    }

    /// Steps the lock step 1 step, and sets a new timeout
    fn force_lock_step(&mut self) -> Option<Poll<Vec<usize>, ()>> {
        let (time_out, maybe_result) = self.lock.do_step();
        self.start_time_out(time_out);

        if let Some(result) = maybe_result {
            println!("Winner: {:?}", result);
            return Some(Ok(Async::Ready(result)));
        }
        None
    }

    /// Steps the lock while ready, or until the game finishes
    fn run_lock(&mut self) -> Option<Poll<Vec<usize>, ()>> {
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
    type Item = Vec<usize>;
    type Error = ();

    fn poll(&mut self) -> Poll<Vec<usize>, ()> {
        loop {
            match try!(self.client_msgs.poll()) {
                Async::Ready(mmsg) => {
                    let msg = mmsg.unwrap();
                    self.handle_message(msg.client_id, msg.message);

                    if let Some(re) = self.run_lock() {
                        return re;
                    }
                },
                Async::NotReady => {
                    if self.sleeper.is_expired() {
                        if let Some(re) = self.force_lock_step() {
                            return re;
                        }
                        if let Some(re) = self.run_lock() {
                            return re;
                        }
                    }
                    return Ok(Async::NotReady);
                }
            }

        }
    }
}
