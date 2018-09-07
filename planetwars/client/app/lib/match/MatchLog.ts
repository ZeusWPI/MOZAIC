import { PlanetList, Expedition, Player, JsonExpedition, JsonPlanet } from './types';
import * as _ from 'lodash';
import { events, Event, PwTypes } from "mozaic-client";

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

  public abstract addEntry(entry: Event): void;

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
  public addEntry(entry: Event) {
    switch (entry.eventType) {
      case events.PlayerAction: {
        const entryPA = entry as events.PlayerAction;

        this.getPlayerLog(entryPA.clientId).addRecord(entry);

        break;
      }
      case events.GameStep: {
        const entryGS = entry as events.GameStep;

        Object.keys(this.playerLogs).forEach((clientIdStr) => {
          this.playerLogs[parseInt(clientIdStr, 10)].addRecord(entryGS);
        });

        this.gameStates.push(GameState.fromJson(JSON.parse(entryGS.state)));

        break;
      }
      case events.RegisterClient: {
        const entryRC = entry as events.RegisterClient;

        this.getPlayerLog(entryRC.clientId);

        break;
      }
    }
  }
}

export class JoinedMatchLog extends MatchLog {
  public addEntry(entry: Event) {
    // TODO
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

  public addRecord(record: Event) {
    switch (record.eventType) {
      case events.GameStep: {
        const recordGS = record as events.GameStep;
        this.turns.push({ state: JSON.parse(recordGS.state) });
        break;
      }
      case events.PlayerAction: {
        const recordPA = record as events.PlayerAction;
        this.turns[this.turns.length - 1].command = recordPA.action;
        break;
      }
      // case 'command': {
      //   this.turns[this.turns.length - 1].action = record.action;
      //   break;
      // }
    }
  }
}

export interface PlayerTurn {
  state: GameState;
  command?: string;
  action?: PwTypes.PlayerAction;
}

export interface PlayerMap<T> {
  [player: number]: T;
}

export default MatchLog;
