import * as fs from 'mz/fs';
import * as Promise from 'bluebird';
import { v4 as uuidv4 } from 'uuid';

import {
  IGameState, ILogFormat, Match, MatchStats, MatchStatus,
} from './GameModels';


export function parseLogFile(logPath: string): Promise<IGameState[]> {
  const read = fs.readFile(logPath, 'utf-8')
  return Promise.resolve(read).then((buffer) => {
    const content = buffer.toString();
    return parseContent(content);
  });
}

export function parseLogFileSync(logPath: string): IGameState[] {
  const content = fs.readFileSync(logPath, 'utf-8')
  return parseContent(content);
}

function parseContent(content: string): IGameState[] {
  const lines: string[] = content.trim().split('\n');
  // TODO: this should be made typesafe
  return lines.slice(1).map((line) => JSON.parse(line));
}