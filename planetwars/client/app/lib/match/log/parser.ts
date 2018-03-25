import {
  JsonGameState,
  Player,
  Planet,
  PlanetList,
  Expedition,
  JsonPlanet,
  JsonExpedition,
} from '../types';
import * as fs from 'mz/fs';

import { MatchLog, GameState } from './MatchLog';

interface PlayerData {
  uuid: string;
  name: string;
}

export function parseLog(players: PlayerData[], path: string) {
  const matchPlayers = players.map((data) => {
    return {
      uuid: data.uuid,
      name: data.name,
      score: 0,
    };
  });
  const parser = new LogParser(matchPlayers);
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  lines.forEach((line: string) => {
    parser.parseMessage(JSON.parse(line));
  });
  return parser.log;
}

class LogParser {
  // in-order; for mapping player numbers to player objects.
  public players: Player[];
  public log: MatchLog;

  constructor(players: Player[]) {
    this.players = players;
    this.log = new MatchLog(players);
  }

  public parseMessage(message: LogMessage) {
    switch (message.msg) {
      case 'step': return this.parseStep(message as StepMessage);
    }
  }

  private parseStep(message: StepMessage) {
    // TODO
    const state = this.parseState(message.state);
    this.log.addGameState(state);
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

interface LogMessage {
  msg: string;
  ts: string;
  level: string;
}

interface StepMessage extends LogMessage {
  msg: 'step';
  state: JsonGameState;
}
