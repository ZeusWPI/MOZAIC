
use futures::sync::mpsc::UnboundedSender;
use client_controller::{ClientMessage, Message};
use futures::Future;
use tokio_core::reactor::Handle;
use tokio_core::reactor::Timeout as to;
use tokio_timer::Sleep;
use tokio_timer::Timer;
use tokio::timer::Delay;
use tokio;
use std::time::{Duration, Instant};

use planetwars::controller::PlayerId;

pub struct Timeout{
    game_handle: UnboundedSender<ClientMessage>,
    used: bool,
    timer: Sleep,
}

impl Timeout {
    pub fn new(game_handle: UnboundedSender<ClientMessage>) -> Timeout {
        let timer = Timer::default();
        Timeout {
            game_handle,
            used: true,
            timer: timer.sleep(Duration::from_millis(60000)),
        }
    }

    /// Sends a Message::Timeout after dur micro seconds
    pub fn set_timeout(&mut self, dur: u64) {
        let handle = self.game_handle.clone();
        let end = Instant::now() + Duration::from_millis(dur+5);
        tokio::spawn(
            Delay::new(end).map_err(|e| panic!("delay errored; err={:?}", e))
                .map(move |_| {
                    let msg = ClientMessage {
                        player_id: PlayerId::new(666),
                        message: Message::Timeout,
                    };
                    handle.unbounded_send(msg);
                }
            )
        );
        let timer = Timer::default();
        self.timer = timer.sleep(Duration::from_millis(dur));
        self.used = false;
    }

    /// Returns true if the timeout is really expired
    /// This is necessary because Futures can not be stopped, yet by me
    /// So every timeout message will be send even if it is depricated
    /// This shouldn't be necessary
    pub fn is_expired(&mut self) -> bool {
        if self.timer.is_expired() && !self.used{
            self.used = true;
            return true;
        }
        false
    }
}