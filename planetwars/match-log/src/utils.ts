import { PwTypes, MatchType, MatchStats } from '.';
import { MatchLog, HostedMatchLog, JoinedMatchLog } from './MatchLog';

export function emptyLog(type: MatchType): MatchLog {
  switch (type) {
    case (MatchType.hosted):
      return new HostedMatchLog();
    case (MatchType.joined):
      return new JoinedMatchLog();
  }
}

export function logFileEntries(logFileContent: string): PwTypes.LogEntry[] {
  return logFileContent.trim().split('\n').map((line: string) => JSON.parse(line));
}

export function parseLog(logFileContent: string, type: MatchType): MatchLog {
  const log = emptyLog(type)
  logFileEntries(logFileContent).forEach((entry) => {
    log.addEntry(entry);
  });
  return log;
}

export function calcStats(log: MatchLog): MatchStats {
  return {
    winners: Array.from(log.getWinners()),
    score: calcScores(log),
  };
}

type Scores = { [playerNum: number]: number }
export function calcScores(log: MatchLog): Scores {
  const scores: Scores = {};

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
