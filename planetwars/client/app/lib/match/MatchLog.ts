import { PwTypes } from 'mozaic-client';
import { PlanetList, Expedition, Player } from './types';
import * as fs from 'fs';
import * as _ from 'lodash';

interface PlayerData {
  uuid: string;
  name: string;
}

export function parseLog(path: string) {
  const log = new MatchLog();
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  lines.forEach((line: string) => {
    log.addEntry(JSON.parse(line));
  });
  return log;
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

export class MatchLog {
  public playerLogs: PlayerMap<PlayerLog>;
  public gameStates: GameState[];

  constructor() {
    this.playerLogs = {};
    this.gameStates = [];
  }

  public addEntry(entry: PwTypes.LogEntry) {
    switch (entry.type) {
      case "game_state": {
        const state = GameState.fromJson(entry.state);
        this.gameStates.push(state);
        break;
      }
      case "player_entry": {
        let playerLog = this.playerLogs[entry.player];
        if (!playerLog) {
          playerLog = new PlayerLog();
          this.playerLogs[entry.player] = playerLog;
        }

        playerLog.addRecord(entry.record);
      }
    }
  }

  public getPlayers(): number[] {
    return Array.from(this.gameStates[0].livingPlayers());
  }

  public getWinners(): Set<number> {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
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

export default MatchLog;
