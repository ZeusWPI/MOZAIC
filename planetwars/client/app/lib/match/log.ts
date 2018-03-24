import {
  GameState,
  JsonGameState,
  Player,
  Planet,
  PlanetList,
  Expedition,
  JsonPlanet,
  JsonExpedition,
} from './types';
import * as fs from 'mz/fs';

export interface MatchLog {
  messages: object[];
  turns: GameState[];
}

export function parseLog(path: string) {
  const parser = new LogParser([]);
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  lines.forEach((line: string) => {
    parser.parseMessage(JSON.parse(line));
  });
  return parser.getLog();
}

class LogParser {
  private players: Player[];
  private log: MatchLog;

  constructor(players: Player[]) {
    this.players = players;
    this.log = {
      messages: [],
      turns: [],
    };
  }

  public getLog(): MatchLog {
    return this.log;
  }

  public parseMessage(message: LogMessage) {
    switch (message.msg) {
      case 'step': return this.parseStep(message as StepMessage);
    }
  }

  private parseStep(message: StepMessage) {
    // TODO
    const state = this.parseState(message.state);
    this.log.turns.push(state);
  }

  private parseState(json: JsonGameState): GameState {
    const state: GameState = {
      planets: {},
      expeditions: [],
    };
    json.planets.forEach((p) => {
      state.planets[p.name] = {
        name: p.name,
        x: p.x,
        y: p.y,
        owner: this.players[p.owner - 1],
        shipCount: p.ship_count,
      };
    });

    json.expeditions.map((e) => {
      state.expeditions.push({
        id: e.id,
        origin: state.planets[e.origin],
        destination: state.planets[e.destination],
        owner: this.players[e.owner - 1],
        shipCount: e.ship_count,
        turnsRemaining: e.turns_remaining,
      });
    });
    return state;
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