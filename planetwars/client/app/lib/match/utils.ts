import * as M from '../../utils/database/models';
import * as fs from 'fs';
import { PwTypes } from '.';
import { MatchLog, HostedMatchLog, JoinedMatchLog } from './MatchLog';

export function emptyLog(type: M.MatchType): MatchLog {
  switch (type) {
    case (M.MatchType.hosted):
      return new HostedMatchLog();
    case (M.MatchType.joined):
      return new JoinedMatchLog();
  }
}

export function logFileEntries(path: string): PwTypes.LogEntry[] {
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  return lines.map((line: string) => JSON.parse(line));
}

export function parseLogFile(path: string, type: M.MatchType): MatchLog {
  const log = emptyLog(type);
  logFileEntries(path).forEach((entry) => {
    log.addEntry(entry);
  });
  return log;
}

export function calcStats(log: MatchLog): M.MatchStats {
  return {
    winners: Array.from(log.getWinners()),
    score: calcScores(log),
  };
}

export function calcScores(log: MatchLog) {
  const scores: { [playerNum: number]: number } = {};

  // initialize scores
  Array.from(log.getPlayers()).forEach((p) => {
    const playerNum = Number(p);
    scores[playerNum] = 0;
  });

  log.gameStates.forEach((state) => {
    Object.keys(state.planets).forEach((planetName) => {
      const planet = state.planets[planetName];
      if (planet.owner) {
        scores[planet.owner] += 1;
      }
    });
  });

  return scores;
}
