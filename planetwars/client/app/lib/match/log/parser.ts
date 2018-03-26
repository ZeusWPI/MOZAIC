import {
  JsonGameState,
  Player,
  Planet,
  PlanetList,
  Expedition,
  JsonPlanet,
  JsonExpedition,
  JsonCommand,
} from '../types';
import * as fs from 'mz/fs';

import { MatchLog, GameState, PlayerInputs } from './MatchLog';

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
      case MessageType.STEP: {
        return this.parseStep(message as StepMessage);
      }
      case MessageType.INPUT: {
        return this.parsePlayerInput(message as PlayerInputMessage);
      }
      case MessageType.PARSE_ERROR: {
        return this.parseInputError(message as InputErrorMessage);
      }
      case MessageType.DISPATCH: {
        return this.parseDispatch(message as DispatchMessage);
      }
      case MessageType.ILLEGAL_COMMAND: {
        return this.parseIllegalCommand(message as IllegalCommandMessage);
      }
    }
  }

  private parseStep(message: StepMessage) {
    const state = this.parseState(message.state);
    this.log.addGameState(state);
  }

  private parsePlayerInput(message: PlayerInputMessage) {
    const player = this.players[message.player_id];
    this.log.setInput(player, message.content);
  }

  private parseInputError(message: InputErrorMessage) {
    const player = this.players[message.player_id];
    this.log.inputError(player, message.error);
  }

  private parseDispatch(message: DispatchMessage) {
    const player = this.players[message.player_id];
    this.log.addCommand(player, {
      command: message.command,
    });
  }

  private parseIllegalCommand(message: IllegalCommandMessage) {
    const player = this.players[message.player_id];
    this.log.addCommand(player, {
      command: message.command,
      error: message.error,
    });
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

enum MessageType {
  STEP = 'step',
  INPUT = 'message received',
  DISPATCH = 'dispatch',
  PARSE_ERROR = 'parse error',
  ILLEGAL_COMMAND = 'illegal command',
}

interface StepMessage extends LogMessage {
  msg: MessageType.STEP;
  state: JsonGameState;
}

interface PlayerInputMessage extends LogMessage {
  msg: MessageType.INPUT;
  player_id: number;
  content: string;
}

interface DispatchMessage extends LogMessage {
  msg: MessageType.DISPATCH;
  player_id: number;
  command: JsonCommand;
}

interface InputErrorMessage extends LogMessage {
  msg: MessageType.PARSE_ERROR;
  player_id: number;
  error: string;
}

interface IllegalCommandMessage extends LogMessage {
  msg: MessageType.ILLEGAL_COMMAND;
  player_id: number;
  command: JsonCommand;
  error: string;
}
