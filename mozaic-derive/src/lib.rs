extern crate proc_macro;
extern crate syn;
#[macro_use]
extern crate quote;

use proc_macro::TokenStream;

#[proc_macro_derive(MozaicEvent, attributes(mozaic_event))]
pub fn derive_mozaic_event(input: TokenStream) -> TokenStream {
    let input: syn::DeriveInput = syn::parse(input).unwrap();
    impl_mozaic_event(&input)
}

fn impl_mozaic_event(ast: &syn::DeriveInput) -> TokenStream {
    let ident = &ast.ident;
    let tokens = quote! {
        impl ::reactors::Event for #ident {
            const TYPE_ID: u32 = 0;
        }
    };
    return tokens.into();
}