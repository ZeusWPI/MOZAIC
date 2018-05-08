import * as External from '../../../lib/match/log';

export class MatchLog {
  public players: Player[];
  public gameStates: GameState[];
  public playerOutputs: PlayerOutputs[];
  public winners: Set<Player>;
  public planets: StaticPlanet[];

  private externalLog: External.MatchLog;

  constructor(log: External.MatchLog) {
    this.externalLog = log;
    this.players = log.players.map((p, id) => ({ ...p, id }));
    this.gameStates = log.gameStates.map((gs) => new GameState(gs, this.players));
    this.playerOutputs = log.playerOutputs;
    this.winners = this.gameStates[this.gameStates.length - 1].livingPlayers;
  }

}

export class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];
  public livingPlayers: Set<Player>;
  public players: PlayerSnapShot[];

  constructor(gameState: External.GameState, players: Player[]) {
    // Adapt Planets
    this.planets = {};
    Object.keys(gameState.planets).forEach((pId) => {
      const planet = gameState.planets[pId];
      const owner = GameState.transformOwner(planet.owner, players);
      this.planets[pId] = { ...planet, owner };
    });

    // Adapt expeditions
    this.expeditions = gameState.expeditions.map((exp) => ({
      ...exp,
      owner: GameState.transformOwner(exp.owner, players),
    }) as Expedition);

    // Calc metadata and stats
    this.livingPlayers = this._livingPlayers();
    this.players = this._playerStats(players);
  }

  public static transformOwner(owner: External.Player | undefined, players: Player[]): Player | undefined {
    if (!owner) { return undefined; }
    return { ...owner, id: GameState._getPlayerId(owner.uuid, players) };
  }

  private static _getPlayerId(uuid: string, players: Player[]): number {
    const player = players.find((p) => p.uuid === uuid);
    if (!player) { throw new Error('We can\'t code (uuid missing in list of players)'); }
    return player.id;
  }

  private _playerStats(_players: Player[]): PlayerSnapShot[] {
    const players = _players.map((p, i) => ({
      index: (GameState.transformOwner(p, _players) as Player).id,
      planetsOwned: 0,
      shipsOwned: 0,
      expeditionsOwned: 0,
    }));

    Object.keys(this.planets).forEach((pId) => {
      const planet = this.planets[pId];
      const { owner, shipCount } = planet;
      if (owner) {
        players[owner.id].planetsOwned += shipCount;
        players[owner.id].shipsOwned += 1;
      }
    });

    this.expeditions.forEach((exp, g) => {
      const { owner, shipCount } = exp;
      players[owner.id].shipsOwned += shipCount;
      players[owner.id].expeditionsOwned += shipCount;
    });

    return players;
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
  id: number;
  uuid: string;
  name: string;
  score: number;
}

// The stats for a player in some point of time
export interface PlayerSnapShot {
  index: number;
  planetsOwned: number;
  shipsOwned: number;
  expeditionsOwned: number;
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

export interface StaticPlanet {
  name: string;
  x: number;
  y: number;
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