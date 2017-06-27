# MVP for introduction day 2017

## About introduction day
Introduction day is an event in function of guiding new students at the start of the academic year.
For the year 2016-2017 it will happen on friday 22/9, while courses will start on 25/9.
This event is an excellent opportunity to promote Zeus WPI as an organization, and MOZAIC/BottleBats as a competition.

## About this MVP
The idea was to let students code in a Scratch (or Scratch-like) environment on desktops already configured by us and let them play some games on the local network against each other.
As to accommodate these requirements this Minimal Viable Product focuses on being able to play local games on a pre-configured system.
This allows us to offer an interactive programming exercise to new students without needing a fully developed and networked platform.

### Unnecessary features

- Everything on the serverside
    - ELO
    - Matchmaking
    - Storing info
    - Webserver
    - Auth
    - Gameserver

- Non core features
    - Game mode selection
    - Etc.

### Necessary features
Depending on time restrictions and priorities we could choose to let them play against each other, predefined bots, or both.
- Compatible Scratch environment
    - A game-logic ready template
    - A scratch compatible bot driver
- Decent live game visualization
- Simple game play control
    - Challenge other player
    - Challenge bot
- Ruleset
    - Simple 2 player game
    - Proposition: [Planet Wars](http://planetwars.aichallenge.org/) with an added rule:
        - Each player can only have one fleet in transit at any given moment.
          This rule greatly reduces the complexity of the game, yet does not alter its core principles
          (please speak up if you think it does!).
- Arbiter
    - Coordinate local play
    - Communicate with bot driver

### Optional features
- Decent debugging support
- Visualizer playback
- Gameplay pausing


