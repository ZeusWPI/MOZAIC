use rand::{thread_rng, Rng};
use rand::distributions::range::SampleRange;
use num::Integer;

use std::ops::Range;
use std::cmp::PartialOrd;

pub struct Bound<T> {
    pub min: T,
    pub max: T,
} 


impl <T> Bound<T>
where T: SampleRange, T: PartialOrd, T: Copy, T: Integer {

    pub fn rand(&self) -> T {
        thread_rng().gen_range::<T>(self.min, self.max)
    }

    // TODO: Figure out how to make this an Iterator or smthg
    pub fn sample(&self, amount: usize) -> Vec<T> {
        (0..amount).map(|_| self.rand()).collect()
    }

    pub fn range(&self) -> Range<T> {
        self.min..self.max
    }
}