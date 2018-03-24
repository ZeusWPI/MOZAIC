import { GameState } from './types';
import * as fs from 'mz/fs';

export interface MatchLog {
  messages: object[];
  turns: GameState[];
}

// TODO
interface Player {
}

export function parseLog(path: string) {
  const parser = new LogParser([]);
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  lines.forEach((line: string) => {
    parser.parseRecord(JSON.parse(line));
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

  public parseRecord(record: any) {
    switch (record['msg']) {
      case 'step': return this.parseStep(record);
      default: return this.parseUnknown(record);
    }
  }

  private parseStep(record: any) {
    // TODO
    this.log.turns.push(record['state']);
  }

  private parseUnknown(record: object) {
    this.log.messages.push(record);
  }
}