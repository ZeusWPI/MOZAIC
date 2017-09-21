<p align="center"><img src="/resources/Design%205.PNG" alt="MOZAIC"/></p>

MOZAIC is the **M**assive **O**nline **Z**eus **A**rtificial **I**ntelligence **C**ompetition platform.
It aims to provide a flexible platform to host your very own AI competition. Just plug your game, and off you go!

Eventually MOZAIC should be very modular, so that you can provide a custom-tailored experience for your competitors, without having to worry about the heavy lifting.

# Features
For now MOZAIC is still in its early stages, but at Zeus WPI we're already getting it ready to support our own AI competition. As the platfrom matures, our specific usecase will be factored out and more features will be added.

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

# Setup

For what we have now (a local client), you can do the following to play a game:
 1. Install rust and cargo
 2. Try to run the botrunner with `cargo run` in the `src\botdriver` directory (it will fail to play a match).
 3. Write a config for a match, or use the example in `src\games\planetwars\config_examples\stub.config.json`.
 4. Run the botrunner again with `cargo run src\games\planetwars\config_examples\stub.config.json`.
 5. It should have generated a log-file `log.json` (or whatever you specified in the config).
 6. Open the visualizer `src\games\planetwars\visualizer\index.html` with your browser.
 7. Click to `browse` button and select the log file.
 8. You're ready to see the game.

You can change the bots, the maps, the startpositions, the max turn and the logfile in the config.

We have no idea if we support Windows, we probably do.

# Contact
Have any questions, comments, want to contribute or are even remotely interested in this project, please get in touch!
You can reach us by [e-mail](mailto:bestuur@zeus.ugent.be), [Facebook](https://www.facebook.com/zeus.wpi), or any other way you prefer listed [here](https://zeus.ugent.be/about/).
