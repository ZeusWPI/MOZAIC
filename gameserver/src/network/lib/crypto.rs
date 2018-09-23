use sodiumoxide::crypto::kx;

// TODO: provide own crypto errors module
use network::server::handshake::errors::Result;
use std::io;

use sodiumoxide::crypto::aead;
use protocol::EncryptedPacket;
use prost::Message;

pub struct KxKeypair {
    pub secret_key: kx::SecretKey,
    pub public_key: kx::PublicKey,
}

impl KxKeypair {
    pub fn gen() -> Self {
        let (public_key, secret_key) = kx::gen_keypair();

        return KxKeypair {
            public_key,
            secret_key,
        }
    }

    pub fn server_session_keys(&self, client_pk: &kx::PublicKey) 
        -> Result<SessionKeys>
    {
        let res = kx::server_session_keys(
            &self.public_key,
            &self.secret_key,
            client_pk
        );

        match res {
            Ok((rx, tx)) => Ok(SessionKeys { rx, tx }),
            Err(()) => bail!("bad public key"),
        }
    }
}

pub struct SessionKeys {
    pub rx: kx::SessionKey,
    pub tx: kx::SessionKey,
}

pub struct Encryptor {
    /// Key used for sending messages
    tx: aead::Key,
    /// Key used for receiving messages
    rx: aead::Key,

    // nonce used for encrypting messages
    nonce: aead::Nonce,
}

impl Encryptor {
    pub fn from_keys(keys: &SessionKeys) -> Self {
        Encryptor {
            tx: aead::Key::from_slice(&keys.tx[..]).unwrap(),
            rx: aead::Key::from_slice(&keys.rx[..]).unwrap(),

            nonce: aead::gen_nonce(),
        }
    }

    pub fn encrypt(&mut self, data: &[u8]) -> Vec<u8> {
        // make sure nonce is fresh
        self.nonce.increment_le_inplace();

        let data = aead::seal(
            data,
            None,
            &self.nonce,
            &self.tx,
        );

        let nonce = self.nonce[..].to_vec();

        let encrypted = EncryptedPacket { nonce, data };
        let mut buffer = Vec::with_capacity(encrypted.encoded_len());
        encrypted.encode(&mut buffer).unwrap();

        return buffer;
    }

    pub fn decrypt(&mut self, data: &[u8]) -> io::Result<Vec<u8>> {
        let encrypted = try!(EncryptedPacket::decode(data));

        let nonce = match aead::Nonce::from_slice(&encrypted.nonce) {
            None => bail!(
                io::Error::new(io::ErrorKind::Other, "invalid nonce")
            ),
            Some(nonce) => nonce,
        };

        let res = aead::open(
            &encrypted.data,
            None,
            &nonce,
            &self.rx,
        );
        match res {
            Ok(data) => return Ok(data),
            Err(()) => bail!(
                io::Error::new(io::ErrorKind::Other, "decryption failed")
            ),
        }
    }
}