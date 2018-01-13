# PlanetWars Web

## Purpose

This project tries to be a pretty website for the BottleBats competition for the PlanetWars AI game. It is a small Rust (Rocket) backend serving probably only a React.js frontend, and maybe some specific API's.

The client-side should do these things:

- In general be a pwetty landing page for the BattleBots competition
- Have useful links (GitHub, Zeus, Mailinglist, ...)
- Serve the downloads for the Electron client
- Explain the rules and competition format
- Provide event details (code sessions, live tournaments, ...)
- Contain tips, tricks, and code-snippets related to writing your own bot
- Allow you to create an account
- Maybe contain a scoreboard
- Maybe have some blog thingies

## Getting up & running

1. Have **latest** version of rust-nightly installed
- `rustup install nightly`
- `rustup update && cargo update`
- run `rustup override set nightly` in this dir to set nightly builds for this project, or `rustup default nightly` to use it everywhere
1. `cargo run`