use std::io;
use std::io::{Result, Stdout, LineWriter, Write};
use serde::Serialize;
use serde_json;

pub struct Logger {
    handle: LineWriter<Stdout>,
}

impl Logger {
    pub fn new() -> Self {
        Logger {
            handle: LineWriter::new(io::stdout()),
        }
    }

    pub fn log_line(&mut self, line: &str) -> Result<()> {
        write!(&mut self.handle, "{}\n", line)
    }

    pub fn log_json<S>(&mut self, data: &S) -> Result<()>
        where S: Serialize
    {
        let line = serde_json::to_string(data)?;
        return self.log_line(&line);
    }
}
