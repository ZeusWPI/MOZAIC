# Architecture components
What are they and what should they do?

Listing:
- Filer: Ranker & Archiver
- Game Server: Referee & Matchmaker
- Gamerules
- Datastore
- Webserver
- Client: Bot driver & Controller
- Visualizer

Some of these components are more essential than others.
For the initial development and our MVP, components below provide the core system:
 - Bot driver
 - Visualizer
 - Game rules

See [architecture.md](https://github.com/ZeusWPI/MOZAIC/blob/master/docs/architecture.md) for the overview.

## Client
### Bot driver
The bot driver initially will control the actual running of a game. Read this as loading a match-config, starting the bots, and controlling the communication between the game-rules and the bots. Later on it will do mostly the same, but will do the communication with the game server instead.

### Client controller
The client GUI's only goal is to improve the user experience. By hiding implementation details behind a more user friendly interface it allows users to focus on writing and playing with their bots. It provides a gateway to use the platform's various features in a graphical (or CLI) nature.

## Data store
The data store stores data.

## Filer
### Ranker
When matches are played, we gain some information related to rating and ranking the bots.
The ranking systems calculates new scores for each participant based on their previous score, whether they won or lost, and who they played against.
This imposed ranking allows us to identify the best bots and add a competitional aspect.

### Archiver
While the game server is running games, it generates a lot of information it doesn't want to keep track off itself, but might be relevant for other components. The archiver's role is to keep track of this data and bundle it so it can be used later.
Obvious candidates to include in this data are various metadata such as game winners, game duration, etc.

## Game server
the gameserver is in charge of connecting the clients.
### Referee
The referee is the component in charge of actually running games.
It distributes the known game state between players, and receives the incoming responses containing their respective moves made.
The relevant info is passed to the rule set and the cycle continues.

### Matchmaker
The matchmakers goal is to keep a pool of ready-to-play bots and match them against one another such that relevant and exciting games are played.
The ELO ratings are an important aspect of fair and relevant matchmaking.

## Gamerules
A rule set is a component that takes a game state and a set of moves and produces the new game state.
It is purely functional in its required features (but could be implemented otherwise) and can be viewed as the rules for the game(mode).

## Webserver
The webserver provides some of the functionality that integrates nicely with the web. It will function as a portal to some of the information about the competition itself in a human readable format. Examples include the rules and the current standings.