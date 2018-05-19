import * as M from '../../utils/database/models';
import { parseLog, MatchLog, PwGameLog } from './MatchLog';

export function readLog(match: M.Match): PwGameLog {
  const parsedLog = parseLog(match.logPath);
  switch (match.type) {
    case (M.MatchType.hosted): {
      return parsedLog;
    }
    case (M.MatchType.joined): {
      return parsedLog.playerLogs[1];
    }
  }
}

export function calcStats(log: PwGameLog): M.MatchStats {
  return {
    winners: Array.from(log.getWinners()),
    score: calcScores(log),
  };
}

export function calcScores(log: PwGameLog) {
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

