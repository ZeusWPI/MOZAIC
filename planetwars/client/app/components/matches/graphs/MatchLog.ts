import * as External from '../../../lib/match/log';

export class MatchLog {
  public players: Player[];
  public gameStates: GameState[];
  public playerOutputs: PlayerOutputs[];
  public winners: Set<Player>;
  public planets: StaticPlanet[];
  public planetMap: Dict<StaticPlanet>;
  public eliminations: DeathEvent[];
  public expeditions: StaticExpedition[];

  private externalLog: External.MatchLog;

  constructor(log: External.MatchLog) {
    this.externalLog = log;
    this.players = log.players.map((p, id) => ({ ...p, id }));
    this.gameStates = log.gameStates.map((gs) => new GameState(gs, this.players));
    this.playerOutputs = log.playerOutputs;
    this.winners = this.gameStates[this.gameStates.length - 1].livingPlayers;

    this.planets = [];
    this.planetMap = {};
    const firstState = this.gameStates[0];
    Object.keys(firstState.planets).forEach((name, index) => {
      const { x, y } = firstState.planets[name];
      const p = { name, x, y, index };
      this.planets.push(p);
      this.planetMap[p.name] = p;
    });

    this.eliminations = [];
    this.gameStates.slice(1).forEach((gs, iMin1) => {
      const i = iMin1 + 1;
      const prev = this.gameStates[i - 1].livingPlayers;
      prev.forEach((p) => {
        if (!gs.livingPlayers.has(p)) {
          this.eliminations.push({ player: p.id, turn: i });
        }
      });
    });

    const seenExpeditions = new Set();
    this.expeditions = [];
    this.gameStates.forEach((gs, turn) => {
      gs.expeditions.forEach((e) => {
        if (seenExpeditions.has(e.id)) { return; }
        seenExpeditions.add(e.id);
        const { origin, destination, owner, turnsRemaining, id, shipCount } = e;
        const duration = turnsRemaining;
        const exp = { origin, destination, owner, id, turn, shipCount, duration };
        this.expeditions.push(exp);
      });
    });
  }
}

function distance(or: StaticPlanet, dest: StaticPlanet) {
  return Math.ceil(Math.sqrt(
    Math.pow(dest.x - or.x, 2) +
    Math.pow(dest.y - or.y, 2)));
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
    return GameState._getPlayer(owner.uuid, players);
  }

  private static _getPlayer(uuid: string, players: Player[]): Player {
    const player = players.find((p) => p.uuid === uuid);
    if (!player) { throw new Error('We can\'t code (uuid missing in list of players)'); }
    return player;
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
        players[owner.id].shipsOwned += shipCount;
        players[owner.id].planetsOwned += 1;
      }
    });

    this.expeditions.forEach((exp, g) => {
      const { owner, shipCount } = exp;
      players[owner.id].shipsOwned += shipCount;
      players[owner.id].expeditionsOwned += 1;
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

export interface DeathEvent {
  player: number;
  turn: number;
}

export interface PlanetList {
  [name: string]: Planet;
}

// tslint:disable-next-line:interface-over-type-literal
export type Dict<V> = {
  [key: string]: V;
};

export interface StaticPlanet {
  index: number;
  name: string;
  x: number;
  y: number;
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

export interface StaticExpedition {
  id: number;
  turn: number;
  origin: Planet;
  destination: Planet;
  owner: Player;
  shipCount: number;
  duration: number;
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
