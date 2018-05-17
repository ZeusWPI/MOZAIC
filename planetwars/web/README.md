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
1. Have Node.js and Yarn installed
1. Run `yarn install`
1. To build $ run either do:
- Run `yarn run build && yarn start`
- Or run 'cargo run' and 'yarn run watch' (in different terminals), you can then just refresh the webpage when you update the client-side (updating the backend would still require another cargo call of course)

## Guide for newbies about the project stack

We use a lot of technologies together, which might seem the stack seem quite complicated, and well it is, but that's just webthings and us being silly. It's not too hard actually. So we have:

- `src`: A Rust webserver (Rocket framework) doing one thing mostly: serving 'index.html' and the `dist/` directory.
- `index.html`: A simple HTML page, with nothing in it actually, it just loads the `dist/bundle.js` script.
- `dist/bundle.js`: The compiled output from our frontend, more about it later!
- `frontend/`: Our client-side React frontend. It's JS we send to the clients that handles everything from that side, it will render all extra HTML, do logic, fix links, etc...
- `frontend/`: Well it's not actually JS, it's TypeScript, a typed JavaScript superset, we need to compile this (the config is 'tsconfig.json`).
- 'webpack.config.js': We want to use all these packages from the Node.js ecosystem we specified in our config `package.json`, but we can't just send all off that over the web! That's where we webpack comes in: it bundles all the relevant JS into one file `dist/bundle.js` that we can easily load. Oh, it also compiles the TS for you.
- `dist/`: All the scripts (`dist/bundle.js`) and other (static) output such as images and CSS.