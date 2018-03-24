import {
  JsonGameState,
  Player,
  Planet,
  PlanetList,
  Expedition,
  JsonPlanet,
  JsonExpedition,
} from './types';
import * as fs from 'mz/fs';

export function parseLog(path: string) {
  const parser = new LogParser([]);
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  lines.forEach((line: string) => {
    parser.parseMessage(JSON.parse(line));
  });
  return parser.log;
}

class LogParser {
  public players: Player[];
  public log: MatchLog;

  constructor(players: Player[]) {
    this.players = players;
    this.log = new MatchLog();
  }


  public parseMessage(message: LogMessage) {
    switch (message.msg) {
      case 'step': return this.parseStep(message as StepMessage);
    }
  }

  private parseStep(message: StepMessage) {
    // TODO
    const state = this.parseState(message.state);
    this.log.gameStates.push(state);
  }

  private parseState(json: JsonGameState): GameState {
    const planets: PlanetList = {};
    json.planets.forEach((p) => {
      planets[p.name] = {
        name: p.name,
        x: p.x,
        y: p.y,
        owner: this.players[p.owner - 1],
        shipCount: p.ship_count,
      };
    });

    const expeditions = json.expeditions.map((e) => {
      return {
        id: e.id,
        origin: planets[e.origin],
        destination: planets[e.destination],
        owner: this.players[e.owner - 1],
        shipCount: e.ship_count,
        turnsRemaining: e.turns_remaining,
      };
    });
    return new GameState(planets, expeditions);
  }
}

export class MatchLog {
  public gameStates: GameState[];

  public getWinners(): Set<Player> {
    return this.gameStates[this.gameStates.length - 1].livingPlayers();
  }
}

class GameState {
  public planets: PlanetList;
  public expeditions: Expedition[];

  constructor(planets: PlanetList, expeditions: Expedition[]) {
    this.planets = planets;
    this.expeditions = expeditions;
  }

  public livingPlayers(): Set<Player> {
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

interface LogMessage {
  msg: string;
  ts: string;
  level: string;
}

interface StepMessage extends LogMessage {
  msg: 'step';
  state: JsonGameState;
}