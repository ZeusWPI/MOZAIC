import { PlanetList, Expedition } from './types';
import * as PwTypes from './mozaic_types';

export abstract class MatchLog {
  public playerLogs: PlayerMap<PlayerLog>;
  public gameStates: GameState[];

  constructor() {
    this.gameStates = [];
    this.playerLogs = {};
  }

  public getPlayers(): number[] {
    return Array.from(this.gameStates[0].livingPlayers());
  }

  public getWinners(): Set<number> {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
  }

  public abstract addEntry(entry: PwTypes.LogEntry): void;

  protected getPlayerLog(playerNum: number) {
    let playerLog = this.playerLogs[playerNum];
    if (!playerLog) {
      playerLog = new PlayerLog();
      this.playerLogs[playerNum] = playerLog;
    }
    return playerLog;
  }
}

export class HostedMatchLog extends MatchLog {
  public addEntry(entry: PwTypes.LogEntry) {
    switch (entry.type) {
      case "game_state": {
        const state = GameState.fromJson(entry.state);
        this.gameStates.push(state);
        break;
      }
      case "player_entry": {
        this.getPlayerLog(entry.player).addRecord(entry.record);
      }
    }
  }
}

export class JoinedMatchLog extends MatchLog {
  public addEntry(entry: PwTypes.LogEntry) {
    if (entry.type === 'player_entry') {
      // this should always be the case since this is a joined match
      const { player, record } = entry;

      this.getPlayerLog(player).addRecord(record);

      if (player === 1 && record.type === 'step') {
        this.gameStates.push(GameState.fromJson(record.state));
      }
    }
  }
}

export class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];

  constructor(planets: PlanetList, expeditions: Expedition[]) {
    this.planets = planets;
    this.expeditions = expeditions;
  }

  public static fromJson(json: PwTypes.GameState) {
    const planets: PlanetList = {};
    json.planets.forEach((p) => {
      planets[p.name] = {
        name: p.name,
        x: p.x,
        y: p.y,
        owner: p.owner,
        shipCount: p.ship_count,
      };
    });

    const expeditions = json.expeditions.map((e) => {
      return {
        id: e.id,
        origin: planets[e.origin],
        destination: planets[e.destination],
        owner: e.owner,
        shipCount: e.ship_count,
        turnsRemaining: e.turns_remaining,
      };
    });

    return new GameState(planets, expeditions);
  }

  public livingPlayers(): Set<number> {
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

export class PlayerLog {
  public turns: PlayerTurn[];

  constructor() {
    this.turns = [];
  }

  public addRecord(record: PwTypes.LogRecord) {
    switch (record.type) {
      case 'step': {
        this.turns.push({ state: record.state });
        break;
      }
      case 'command': {
        this.turns[this.turns.length - 1].command = record.content;
        break;
      }
      case 'player_action': {
        this.turns[this.turns.length - 1].action = record.action;
        break;
      }
    }
  }
}

export interface PlayerTurn {
  state: PwTypes.GameState;
  command?: string;
  action?: PwTypes.PlayerAction;
}

export interface PlayerMap<T> {
  [player: number]: T;
}

export default MatchLog;
