import * as fs from 'fs';

import {
  IGameState, ILogFormat, IMatchData, IMatchMetaData, IMatchStats,
} from './GameModels';
import { MatchAnalyser } from './MatchAnalyser';

export class MatchParser {

  // TODO: Add Async parser

  public static parseFileSync(logPath: string): IMatchData {
    const contents = fs.readFileSync(logPath, { encoding: 'utf8' });
    const { players, turns } = MatchParser.parseLog(contents);
    const timestamp = new Date(Date.now()); // TODO: Fix this

    const meta: IMatchMetaData = { players, logPath, timestamp };
    const stats: IMatchStats = MatchAnalyser.analyseSync({ players, turns });
    const log = turns;

    return { meta, stats, log };
  }

  private static parseLog(log: string): ILogFormat {
    const lines: string[] = log.trim().split("\n");
    const objects: any = lines.map((line) => JSON.parse(line));
    const players: string[] = objects[0].players;
    const turns: IGameState[] = objects.slice(1);
    return { players, turns };
  }
}
