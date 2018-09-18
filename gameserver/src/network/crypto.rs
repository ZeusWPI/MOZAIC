use sodiumoxide::crypto::kx;

// TODO: don't do this ...
use super::handshake::errors::Result;

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
