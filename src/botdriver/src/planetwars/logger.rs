use std::io::{Result, LineWriter, Write};
use std::fs::File;
use serde::Serialize;
use serde_json;

use planetwars::PlanetWars;


// TODO: it is not hard to see a common pattern here.
// A logger trait might prove an useful abstraction.

pub struct PlanetWarsLogger {
    logger: JSONLogger,
}

impl PlanetWarsLogger {
    pub fn new(file_name: &str) -> Self {
        PlanetWarsLogger {
            logger: JSONLogger::new(file_name),
        }
    }

    pub fn log(&mut self, state: &PlanetWars) -> Result<()> {
        let repr = state.repr();
        return self.logger.log_json(&repr);
    }
}


/// A logger that logs to JSON-lines
#[derive(Debug)]
pub struct JSONLogger {
    handle: LineWriter<File>,
}

impl JSONLogger {
    pub fn new(file_name: &str) -> Self {
        JSONLogger {
            handle: LineWriter::new(File::create(file_name).unwrap()),
        }
    }

    pub fn log_json<S>(&mut self, record: &S) -> Result<()>
        where S: Serialize
    {
        let line = serde_json::to_string(record)?;
        return self.log_line(&line);
    }

    
    fn log_line(&mut self, line: &str) -> Result<()> {
        write!(&mut self.handle, "{}\n", line)
    }
}
