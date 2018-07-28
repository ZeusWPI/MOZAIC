#[macro_use]
extern crate quote;
extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate toml;
extern crate proc_macro2;


use std::fs::File;
use std::io::Read;
use std::collections::HashMap;
use proc_macro2::{Ident, Span};


const FILE_PATH: &'static str = "./test.toml";

#[derive(Serialize, Deserialize, Debug)]
struct MozaicProtocol {
    events: HashMap<String, u32>
}

fn main() {
    let mut f = File::open(FILE_PATH).expect("file not found");
    let mut contents = String::new();
    f.read_to_string(&mut contents).unwrap();
    let protocol: MozaicProtocol = toml::from_str(&contents).unwrap();
    
    for (event_name, event_id) in protocol.events.iter() {
        let event_ident = Ident::new(event_name, Span::call_site());
        let tokens = quote! {
            impl Event for #event_ident {
                const TYPE_ID: u32 = #event_id;

                fn encode(&self) -> Vec<u8> {
                    let mut bytes = BytesMut::with_capacity(item.encoded_len());
                    // encoding can only fail because the buffer does not have
                    // enough space allocated, but we just allocated the
                    // required space.
                    item.encode(&mut bytes).unwrap();
                    self.buffered = Some(bytes);
                    Ok(AsyncSink::Ready)
                }

                fn decode(bytes: &[u8]) -> Self {
                    <Self as Message>::decode(bytes)
                        .expect("event deserialization failed")
                }
            }
        };
        println!("{}", tokens);
    }
}