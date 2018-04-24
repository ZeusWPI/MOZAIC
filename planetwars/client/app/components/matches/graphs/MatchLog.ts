import * as External from '../../../lib/match/log';

export class MatchLog {
  public players: Player[];
  public gameStates: GameState[];
  public playerOutputs: PlayerOutputs[];
  public winners: Set<Player>;

  private externalLog: External.MatchLog;

  constructor(log: External.MatchLog) {
    this.externalLog = log;
    this.players = log.players;
    this.gameStates = log.gameStates.map((gs) => new GameState(gs));
    this.playerOutputs = log.playerOutputs;
    this.winners = this.gameStates[this.gameStates.length - 1].livingPlayers;
  }
}

export class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];
  public livingPlayers: Set<Player>;

  constructor(gameState: External.GameState) {
    this.planets = gameState.planets;
    this.expeditions = gameState.expeditions;
    this.livingPlayers = this._livingPlayers();
  }

  private _livingPlayers(): Set<Player> {
    const livingPlayers = new Set();
    Object.keys(this.planets).forEach((planetName) => {
      const planet = this.planets[planetName];
      if (planet.owner) {
        livingPlayers.add(planet.owner);
      }
    });
    this.expeditions.forEach((expedition) => {
      livingPlayers.add(expedition.owner);
    });
    return livingPlayers;
  }
}

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface Player {
  uuid: string;
  name: string;
  score: number;
}

export interface PlanetList {
  [name: string]: Planet;
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  owner?: Player;
  shipCount: number;
}

export interface Expedition {
  id: number;
  origin: Planet;
  destination: Planet;
  owner: Player;
  shipCount: number;
  turnsRemaining: number;
}

export interface PlayerOutputs {
  [playerId: string]: PlayerOutput;
}

export interface PlayerOutput {
  raw: string;
  error?: string;
  commands: Command[];
}

export interface Command {
  command: JsonCommand;
  error?: string;
}

export interface JsonCommand {
  "origin": string;
  "destination": string;
  "ship_count": string;
}
