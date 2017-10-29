use std::io::{Result, LineWriter, Write};
use std::fs::File;
use serde::Serialize;
use serde_json;

#[derive(Debug)]
pub struct JSONLogger {
    handle: LineWriter<File>,
}

impl JSONLogger {
    pub fn new(name: &str) -> Self {
        JSONLogger {
            handle: LineWriter::new(File::create(name).unwrap()),
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
