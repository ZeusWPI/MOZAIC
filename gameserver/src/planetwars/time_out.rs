
use futures::sync::mpsc::UnboundedSender;
use client_controller::{ClientMessage, Message};
use futures::Future;
use tokio_core::reactor::Handle;
use tokio_core::reactor::Timeout as to;
use tokio_timer::Sleep;
use tokio_timer::Timer;
use std::time::Duration;

use planetwars::controller::PlayerId;

pub struct Timeout{
    game_handle: UnboundedSender<ClientMessage>,
    loop_handle: Handle,
    used: bool,
    timer: Sleep,
}

impl Timeout {
    pub fn new(game_handle: UnboundedSender<ClientMessage>, loop_handle: Handle) -> Timeout {
        let timer = Timer::default();
        Timeout {
            game_handle,
            loop_handle,
            used: true,
            timer: timer.sleep(Duration::from_millis(60000)),
        }
    }

    /// Sends a Message::Timeout after dur micro seconds
    pub fn set_timeout(&mut self, dur: u64) {
        let out = self.game_handle.clone();
        if let Ok(t) = to::new(Duration::from_millis(dur + 5), &self.loop_handle) {
            self.loop_handle.spawn(
                t.and_then(move |_| {
                    let msg = ClientMessage {
                        player_id: PlayerId::new(666),
                        message: Message::Timeout,
                    };
                    out.unbounded_send(msg).expect("handle broke in timeout");
                    Ok(())
                }).map_err(|err| println!("server error {:?}", err)) 
            );
        }
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