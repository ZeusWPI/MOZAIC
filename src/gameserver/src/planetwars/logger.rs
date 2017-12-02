use std::io::{Result, LineWriter, Write};
use std::fs::File;
use serde::Serialize;
use serde_json;

/// A logger that logs to JSON-lines
#[derive(Debug)]
pub struct JsonLogger {
    handle: LineWriter<File>,
}

impl JsonLogger {
    pub fn new(file_name: &str) -> Self {
        JsonLogger {
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
