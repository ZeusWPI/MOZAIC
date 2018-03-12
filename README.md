<p align="center"><img src="/resources/Design%205.PNG" alt="MOZAIC"/></p>

# MOZAIC

MOZAIC is the **M**assive **O**nline **Z**eus **A**rtificial **I**ntelligence **C**ompetition platform.
It aims to provide a flexible platform to host your very own AI competition. Just plug your game, and off you go!

Eventually MOZAIC should be very modular, so that you can provide a custom-tailored experience for your competitors, without having to worry about the heavy lifting.

## Features

For now MOZAIC is still in its early stages, but at Zeus WPI we're already getting it ready to support our own AI competition. As the platfrom matures, our specific use-case will be factored out and more features will be added.

Current and planned features:

- [ ] Generic over game rules
  - [ ] implemented in Rust
  - [ ] ...
- [ ] Game logging
- [ ] Visualizers for your game
- [ ] Uploading bots
  - [ ] Python or something
  - [ ] Any language, really
- [ ] Fancy website
- [ ] Network play
- [ ] Flexible and performant game server
- [ ] Friendly electron client
  - [ ] handles network play
  - [ ] "bot management"
- [ ] Ranking bots

## Setup

### Gameserver

1. Install rust and cargo (take look [here](https://rustup.rs/) if you're using an older software repository such as Ubuntu apt).
    - Rust >= 1.18.0
    - Cargo >= 0.16.0

1. Try to run the botrunner with `cargo run` in the `gameserver` directory. It should compile, but fail to play a match.
1. Run the botrunner again (still in the `gameserver` directory) with:
    - Linux - `cargo run ../planetwars/examples/configs/stub.json`
    - Windows - `cargo run ..\planetwars\examples\configs\stub.windows.json`
1. It should have generated a log-file `log.json`.
1. If it did, great, it works! Now run 'cargo build --release'.
1. Check setup below for the client.

### Client

**Note:** Do the setup for the gameserver first

1. Install Node v8 and npm.
1. Go the `planetwars\client` directory
1. Install dependencies with `npm install`.
1. Go the `.\bin` dir and symlink the gameserver with:
    * Linux -  `ln -s ../../../gameserver/target/release/mozaic_bot_driver`
    * Windows -  `mklink bot_driver.exe ..\..\..\gameserver\target\release\mozaic_bot_driver.exe`
1. Go back the `client` dir and run `npm run dev`.
1. An electron client should be at your disposal!

## Contact

Have any questions, comments, want to contribute or are even remotely interested in this project, please get in touch!
You can reach us by [e-mail](mailto:bestuur@zeus.ugent.be), [Facebook](https://www.facebook.com/zeus.wpi), or any other way you prefer listed [here](https://zeus.ugent.be/about/).
