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

  // this should be set when parsing the first gamestate.
  // Also, this sucks. Please get rid of this ASAP.
  private players: number[];

  constructor() {
    this.playerLogs = {};
    this.gameStates = [];
    this.players = [];
  }

  public addEntry(entry: PwTypes.LogEntry) {
    if (!this.playerLogs[entry.player]) {
      this.playerLogs[entry.player] = new PlayerLog();
    }

    this.playerLogs[entry.player].addRecord(entry.record);

    if (entry.record.type === 'step') {
      this.handleState(entry.player, entry.record);
    }
  }

  public getPlayers(): number[] {
    return this.players;
  }

  public getWinners(): Set<number> {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
  }

  private handleState(clientNum: number, record: PwTypes.StepRecord) {
    if (this.gameStates.length === 0) {
      this.init(clientNum, record.state);
    }

    // only handle new states
    if (record.turn_number > this.gameStates.length) {
      const state = this.parseState(clientNum, record.state);
      this.gameStates.push(state);
    }
  }

  /**
   * Init the log from a first state
   * @param json the json representation of the state
   */
  private init(clientNum: number, json: PwTypes.GameState) {
    const players = new Set<number>();
    json.planets.forEach((planet) => {
      if (planet.owner) {
        players.add(planet.owner);
      }
    });
    const rotation = playerRotation(clientNum, players.size);
    this.players = _.map(Array.from(players), rotation);
  }

  private parseState(clientNum: number, json: PwTypes.GameState): GameState {
    const rotate = playerRotation(clientNum, this.players.length);

    const planets: PlanetList = {};
    json.planets.forEach((p) => {
      planets[p.name] = {
        name: p.name,
        x: p.x,
        y: p.y,
        owner: p.owner ? rotate(p.owner) : p.owner,
        shipCount: p.ship_count,
      };
    });

    const expeditions = json.expeditions.map((e) => {
      return {
        id: e.id,
        origin: planets[e.origin],
        destination: planets[e.destination],
        owner: rotate(e.owner),
        shipCount: e.ship_count,
        turnsRemaining: e.turns_remaining,
      };
    });

    return new GameState(planets, expeditions);
  }
}

export class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];

  constructor(planets: PlanetList, expeditions: Expedition[]) {
    this.planets = planets;
    this.expeditions = expeditions;
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

function playerRotation(clientNum: number, numPlayers: number) {
  return (playerNum: number) => {
    return ((numPlayers + (playerNum - clientNum)) % (numPlayers)) + 1;
  };
}

export default MatchLog;
