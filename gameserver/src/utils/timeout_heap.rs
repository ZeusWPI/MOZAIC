use futures::{Future, Poll, Async};
use std::cmp::{Ord, Ordering, PartialOrd};
use std::hash::Hash;
use std::collections::{HashSet, BinaryHeap};
use std::time::Instant;


use tokio::timer::Delay;


pub struct TimeoutHeap<K> {
    deadlines: BinaryHeap<Deadline<K>>,
    key_set: HashSet<K>,
    delay: Delay,
}

impl<K> TimeoutHeap<K>
    where K: Hash + Eq + Clone
{
    pub fn new() -> Self {
        TimeoutHeap {
            deadlines: BinaryHeap::new(),
            key_set: HashSet::new(),
            delay: Delay::new(Instant::now()),
        }
    }

    pub fn set_timeout(&mut self, key: K, instant: Instant) {
        if instant < self.delay.deadline() || self.deadlines.is_empty() {
            self.delay.reset(instant);
        }

        self.key_set.insert(key.clone());
        self.deadlines.push(Deadline { key, instant });
    }

    pub fn cancel_timeout(&mut self, key: K) {
        self.key_set.remove(&key);
    }

    /// Poll for an elapsed deadline
    pub fn poll(&mut self) -> Poll<K, ()> {
        // TODO: comment this.

        try_ready!(self.poll_delay());

        // TODO: especially this frankenstein
        {
            let deadline = match self.deadlines.peek() {
                None => return Ok(Async::NotReady),
                Some(deadline) => deadline,
            };

            if Instant::now() <= deadline.instant {
                return Ok(Async::NotReady);
            }
        }

        let deadline = self.deadlines.pop().unwrap();
        let key = deadline.key;
        self.key_set.remove(&key);
        return Ok(Async::Ready(key));
    }

    /// Poll the deadline timer.
    fn poll_delay(&mut self) -> Poll<(), ()> {        
        match self.delay.poll() {
            Ok(res) => return Ok(res),
            // timer errors are programming errors; they should not happen.
            Err(err) => panic!("timer error: {:?}", err),
        }
    }
}


/// Marks when a timeout should be yielded for a key.
#[derive(Clone, Copy, Eq, PartialEq)]
struct Deadline<K> {
    key: K,
    instant: Instant,
}

impl<K: Eq> Ord for Deadline<K> {
    fn cmp(&self, other: &Deadline<K>) -> Ordering {
        // reverse order so that the maximum deadline expires first.
        other.instant.cmp(&self.instant)
    }
}

impl<K: Eq> PartialOrd for Deadline<K> {
    fn partial_cmp(&self, other: &Deadline<K>) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
