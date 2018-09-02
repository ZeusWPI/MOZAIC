use std::sync::{Arc, Mutex};

use super::connection_table::{ConnectionTable, ConnectionData};
use super::connection_handler::ConnectionHandle;

pub trait Router {
    fn route(&mut self, &[u8]) -> Result<usize, ()>;
    fn unregister(&mut self, usize);
}

pub struct ConnectionRouter<R: Router> {
    pub router: Arc<Mutex<R>>,
    pub connection_table: Arc<Mutex<ConnectionTable>>,
}

impl<R: Router> Clone for ConnectionRouter<R> {
    fn clone(&self) -> Self {
        ConnectionRouter {
            router: self.router.clone(),
            connection_table: self.connection_table.clone(),
        }
    }
}

impl<R: Router> ConnectionRouter<R> {
    pub fn route(&mut self, msg: &[u8]) -> Result<ConnectionData, ()> {
        let mut router = self.router.lock().unwrap();
        let connection_id = try!(router.route(msg));
        let mut connection_table = self.connection_table.lock().unwrap();
        let data = connection_table.get(connection_id).unwrap().clone();
        return Ok(data);
    }
}
