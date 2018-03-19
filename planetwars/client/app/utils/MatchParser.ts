import * as fs from 'mz/fs';
import * as Promise from 'bluebird';
import { v4 as uuidv4 } from 'uuid';

import {
  IGameState, ILogFormat, IMatchMetaData, IMatchStats, IMatchData, MatchStatus,
} from './GameModels';
import { MatchAnalyser } from './MatchAnalyser';

// TODO: Clean this up, we probably want to make timestamp and
// uuid more explicit, and status;
// TODO fuck this whole mess
export class MatchParser {

  public static parseFileAsync(logPath: string): Promise<IMatchData> {
    const read = fs.readFile(logPath, 'utf-8');
    return Promise.resolve(read)
      .then((buffer) => buffer.toString())
      .then((contents) => MatchParser._parseMatch(contents))
      .tap((match) => { match.meta.logPath = logPath; });
  }

  public static parseFileSync(logPath: string): IMatchData {
    const contents = fs.readFileSync(logPath, { encoding: 'utf8' });
    const match = MatchParser._parseMatch(contents);
    match.meta.logPath = logPath;
    return match;
  }

  private static _parseMatch(contents: string): IMatchData {
    const { players, turns } = MatchParser._parseLog(contents);
    const timestamp = new Date(Date.now()); // TODO: Fix this
    const uuid = uuidv4();
    const stats: IMatchStats = MatchAnalyser.analyseSync({ players, turns });
    const status = MatchStatus.imported; // TODO: Fix this bullshit
    const meta: IMatchMetaData = { players, uuid, timestamp, stats, status };

    return { meta, log: turns };
  }

  private static _parseLog(contents: string): ILogFormat {
    const lines: string[] = contents.trim().split("\n");
    const objects: any = lines.map((line) => JSON.parse(line));
    const players: string[] = objects[0].players;
    const turns: IGameState[] = objects.slice(1);
    return { players, turns };
  }
}
