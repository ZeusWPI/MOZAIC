use std::io;
use std::sync::{Arc, Mutex};
use sodiumoxide::crypto::sign::{PublicKey, SecretKey};
use reactors::{WireEvent, EventHandler};
use std::marker::PhantomData;

use super::ConnectionHandle;
use super::connection_table::{ConnectionTable, ConnectionData};

pub trait Router {
    fn route(&self, &[u8]) -> Result<Routing<Self>, io::Error>;
    fn unregister(&mut self, usize);
}

pub enum Routing<R>
    where R: Router + ?Sized
{
    Connection(usize),
    NewConnection(NewConnection<R>),
}

pub struct NewConnection<R>
    where R: Router + ?Sized
{
    public_key: PublicKey,
    connection_table: Arc<Mutex<ConnectionTable>>,
    creator: Box<ConnectionCreator<R>>
}

trait ConnectionCreator<R> {
    fn create_connection(self, &mut ConnectionTable, router: &mut R);
}

pub struct SimpleConnectionCreator<R, H, F>
    where H: EventHandler<Output = io::Result<WireEvent>>,
          F: FnOnce(ConnectionHandle, &mut R) -> H
{
    creator: F,
    public_key: PublicKey,
    phantom_r: PhantomData<R>,
    phantom_h: PhantomData<H>,
}

impl<R, H, F> ConnectionCreator<R> for SimpleConnectionCreator<R, H, F>
    where H: EventHandler<Output = io::Result<WireEvent>>,
          F: FnOnce(ConnectionHandle, &mut R) -> H,
          H: Send + 'static
{
    fn create_connection(self, conn_table: &mut ConnectionTable, router: &mut R)
    {
        conn_table.create(self.public_key, |handle| {
            (self.creator)(handle, router)
        });
    }
}

pub struct ConnectionRouter<R: Router> {
    pub router: Arc<Mutex<R>>,
    pub connection_table: Arc<Mutex<ConnectionTable>>,
    pub secret_key: SecretKey,

}

impl<R: Router> Clone for ConnectionRouter<R> {
    fn clone(&self) -> Self {
        ConnectionRouter {
            router: self.router.clone(),
            connection_table: self.connection_table.clone(),
            secret_key: self.secret_key.clone(),
        }
    }
}

impl<R: Router> ConnectionRouter<R> {
    pub fn route(&mut self, msg: &[u8]) -> Result<ConnectionData, io::Error>
    {
        let mut router = self.router.lock().unwrap();
        let connection_id = try!(router.route(msg));
        let mut connection_table = self.connection_table.lock().unwrap();
        unimplemented!()
    }
}
