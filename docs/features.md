# Feature list
This list is a conceptual collection of features we would like to support eventually.
Note that this list might not ever be complete and applies no ordering or priority on the listed features.

- Matches & Challenging
  - Local play: Allowing players to compete on the local network, eliminating the need for internet connectivity or an intermediary server.

  - Networked play: Players should be able to compete versus others connected to our network.

  - Player challenging: Players should be able to challenge others on the network in friendly spirit. A player can choose to build a lobby in which he could invite friends and start a match independent of our own matchmaking.

  - Automatic matchmaking: When players indicate they are ready to play a game, we should match against like minded players when these are available.

  - Ranked environment: We could rate and rank players when they play games adding a global competition aspect.

  - Test bots: To improve their bots without bothering their friends or risk losing rank due to untested changes, players could challenge some test bots and iterate on their bots behavior.

- Rules
  - Interchangeable rule sets: Games should be able to be swapped out on the fly in this infrastructure.

  - Multiple rule sets should be available at the same time, allowing players to pick whichever game they prefer.

  - Many players: It should be possible to write games for an arbitrary number of players.

- Structural support:
  - Server hosted bots: We could provide some server resources were players are able to drop their bots for the night, made available for playing.
This eliminates the need for player PC's being online for an extended period off time to actually play matches when player-count is low.

- Debugging support: When confronted with error messages and faulty bots, players should have the tools at their disposal to repair their bots.
  - Local test bots: Since networked play might introduce some unwanted latency or other technological restrictions it should be possible to play a local test bot.

  - Environment/IDE supported debugging: We don't want an integrated debugger for obvious reasons, thus the best way to enable players to debug their bots is to allow them to debug from their developing environment, for example their favorite IDE.A debugger process should be able to attach to a bot playing the game, ideally one should be able to run their bot from within their IDE.

  - Error feedback: When a bot error occurs during networked play, the owner of the faulty bot should receive as much information about the problem as possible as to allow them to find the source of a maybe hard to reproduce problem.
