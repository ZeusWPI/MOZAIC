import * as fs from 'mz/fs';
import * as Promise from 'bluebird';

import {
  IGameState, ILogFormat, IMatchMetaData, IMatchStats,
} from './GameModels';
import { MatchAnalyser } from './MatchAnalyser';

export class MatchParser {

  // TODO: Add Async parser
  public static parseFileAsync(logPath: string): Promise<IMatchMetaData> {
    const native = fs.readFile(logPath, 'utf-8')
      .then((buffer) => buffer.toString())
      .then((contents) => MatchParser._logToMeta(logPath, contents));
    return Promise.resolve(native);
  }

  public static parseFileSync(logPath: string): IMatchMetaData {
    const contents = fs.readFileSync(logPath, { encoding: 'utf8' });
    return MatchParser._logToMeta(logPath, contents);
  }

  private static _logToMeta(logPath: string, contents: string): IMatchMetaData {
    const { players, turns } = MatchParser.parseLog(contents);
    const timestamp = new Date(Date.now()); // TODO: Fix this

    const stats: IMatchStats = MatchAnalyser.analyseSync({ players, turns });
    const meta: IMatchMetaData = { players, logPath, timestamp, stats };

    return meta;
  }

  private static parseLog(log: string): ILogFormat {
    const lines: string[] = log.trim().split("\n");
    const objects: any = lines.map((line) => JSON.parse(line));
    const players: string[] = objects[0].players;
    const turns: IGameState[] = objects.slice(1);
    return { players, turns };
  }
}
