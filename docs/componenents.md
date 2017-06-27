# Architecture components
What are they and what should they do?

Some of these components are more essential than others (TODO: Specify which).
See [architecture.md](https://github.com/ZeusWPI/MOZAIC/blob/master/docs/architecture.md) for the overview.


## Arbiter

## Auth
Auth being short for authentication and authorization is a component we need to prevent cheaters and evil spirits ruining the experience for our honest competitors. Concretely we need to be sure you are who you are claiming to be so that no false information enters the rest of our system. 

## Bot driver

## Client GUI
The client GUI only goal is to improve the user experience. By hiding implementation details behind a more user friendly interface it allows users to focus on writing and playing with their bots. It provides a gateway to use the platform's various features in a graphical nature.

## Data store
The data store stores data.

## ELO
When matches are played, we gain some information related to rating and ranking the bots.
The ELO systems calculates new scores for each participant based on their previous score, whether they won or lost, and who they played against.
This imposed ranking allows us to identify the best bots and add a competitional aspect.

## Filer
While the game server is running games, it generates a lot of information it doesn't want to keep track off itself, but might be relevant for other components. The filer's role is to keep track of this data and bundle it so it can be used later.
Obvious candidates to include in this data are various metadata such as game winners, game duration, etc.

## Game server
The game server is the component in charge of actually connecting to clients and running games.
It distributes the known game state between players, and receives the incoming responses containing their respective moves made.
The relevant info is passed to the rule set and the cycle continues.

## Matchmaker
The matchmakers goal is to keep a pool of ready-to-play bots and match them against one another such that relevant and exciting games are played.
The ELO ratings are an important aspect of fair and relevant matchmaking.

## Rule set
A rule set is a component that takes a game state and a set of moves and produces the new game state.
It is purely functional in it's required features (but could be implemented otherwise) and can be viewed as the rules for the game(mode).

## Webserver
The webserver provides some of the functionality that integrates nicely with the web. It will function as a portal to some of the information about the competition itself in a human readable format. Examples include the rules and the current standings.

