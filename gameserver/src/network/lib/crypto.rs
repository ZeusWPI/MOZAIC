use sodiumoxide::crypto::kx;

// TODO: provide own crypto errors module
use network::server::handshake::errors::Result;
use std::io;

use sodiumoxide::randombytes::randombytes;
use sodiumoxide::crypto::aead;
use sodiumoxide::crypto::sign;
use sodiumoxide::crypto::sign::{PublicKey, SecretKey, Signature};
use protocol::{SignedMessage, EncryptedPacket};
use prost::Message;

/// How many bytes to use for the authentication nonces
pub const NONCE_NUM_BYTES: usize = 32;

pub fn handshake_nonce() -> Vec<u8> {
    randombytes(NONCE_NUM_BYTES)
}

pub fn sign_message(data: Vec<u8>, key: &SecretKey)
    -> SignedMessage
{
    let signature = sign::sign_detached(&data, key)
        .as_ref()
        .to_vec();

    return SignedMessage { signature, data };
}

pub fn verify_signed_message(message: &SignedMessage, key: &PublicKey)
    -> bool
{
    if let Some(signature) = Signature::from_slice(&message.signature) {
        if sign::verify_detached(&signature, &message.data, key) {
            return true;
        }
    }
    return false;
}


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