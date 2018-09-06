import { PlanetList, Expedition, Player, JsonExpedition, JsonPlanet } from './types';
import * as _ from 'lodash';
import { events } from "mozaic-client";

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

  // TODO: typing
  public abstract addEntry(entry: any /* event */): void;

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
  // TODO: typing
  public addEntry(entry: any) {
    switch (entry.eventType) {
      case events.GameStep: {
        const {state} = entry;
        this.gameStates.push(state);
        break;
      }
      case events.PlayerAction: {
        this.getPlayerLog(entry.clientId).addRecord(entry.action);
      }
    }
  }
}

export class JoinedMatchLog extends MatchLog {
  // TODO: typing
  public addEntry(entry: any) {
    console.log(entry);
    if (entry.eventType === events.PlayerAction) {
      // this should always be the case since this is a joined match
      const { player, action } = entry;

      this.getPlayerLog(player).addRecord(action);

      if (player === 1 && action.type === 'step') {
        this.gameStates.push(GameState.fromJson(action.state));
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

  // TODO: typing
  public static fromJson(json: any) {
    const planets: PlanetList = {};
    json.planets.forEach((p: JsonPlanet) => {
      planets[p.name] = {
        name: p.name,
        x: p.x,
        y: p.y,
        owner: p.owner,
        shipCount: p.ship_count,
      };
    });

    const expeditions = json.expeditions.map((e: JsonExpedition) => {
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

  // TODO: typing
  public addRecord(record: any) {
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
  state: GameState;
  command?: string;
  action?: any /*PlayerAction*/;
}

export interface PlayerMap<T> {
  [player: number]: T;
}

export default MatchLog;
