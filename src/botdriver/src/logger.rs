use std::io::{Result, LineWriter, Write};
use std::fs::File;
use serde::Serialize;
use serde_json;

pub struct Logger {
    handle: LineWriter<File>,
}

impl Logger {
    pub fn new(name: &str) -> Self {
        Logger {
            handle: LineWriter::new(File::create(name).unwrap()),
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
