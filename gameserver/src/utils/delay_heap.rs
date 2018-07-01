use futures::{Future, Poll, Async};
use std::cmp::{Ord, Ordering, PartialOrd, Eq, PartialEq};
use std::collections::BinaryHeap;
use std::time::Instant;

use tokio::timer::Delay;

pub struct DelayHeap<T> {
    heap: BinaryHeap<DelayedValue<T>>,
    delay: Delay,
}

impl<T> DelayHeap<T> {
    pub fn new() -> Self {
        DelayHeap {
            heap: BinaryHeap::new(),
            delay: Delay::new(Instant::now()),
        }
    }

    pub fn push(&mut self, instant: Instant, value: T) {
        if instant < self.delay.deadline() || self.heap.is_empty() {
            self.delay.reset(instant);
        }

        self.heap.push(DelayedValue { instant, value });
    }

    /// Poll for an elapsed deadline
    pub fn poll(&mut self) -> Poll<T, ()> {
        // TODO: comment this.

        try_ready!(self.poll_delay());

        // TODO: especially this frankenstein
        {
            let deadline = match self.heap.peek() {
                None => return Ok(Async::NotReady),
                Some(deadline) => deadline,
            };

            if Instant::now() <= deadline.instant {
                return Ok(Async::NotReady);
            }
        }

        let delayed = self.heap.pop().unwrap();
        return Ok(Async::Ready(delayed.value));
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

/// A value that should be yielded at given instant
#[derive(Clone, Copy)]
struct DelayedValue<T> {
    instant: Instant,
    value: T,
}

impl<T> PartialEq for DelayedValue<T> {
    fn eq(&self, other: &DelayedValue<T>) -> bool {
        self.instant == other.instant
    }
}

impl<T> Eq for DelayedValue<T> { }

impl<T> PartialOrd for DelayedValue<T> {
    fn partial_cmp(&self, other: &DelayedValue<T>) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl<T> Ord for DelayedValue<T> {
    fn cmp(&self, other: &DelayedValue<T>) -> Ordering {
        // reverse order so that the maximum deadline expires first.
        other.instant.cmp(&self.instant)
    }
}
