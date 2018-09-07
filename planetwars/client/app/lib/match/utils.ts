import * as M from '../../database/models';
import * as fs from 'fs';
import { MatchLog, HostedMatchLog, JoinedMatchLog } from './MatchLog';
import { Replayer, events } from "mozaic-client";

export function emptyLog(type: M.MatchType): MatchLog {
  switch (type) {
    case (M.MatchType.hosted):
      return new HostedMatchLog();
    case (M.MatchType.joined):
      return new JoinedMatchLog();
  }
}

// TODO: typing
export function logFileEntries(path: string): any[] {
  const lines = fs.readFileSync(path, 'utf-8').trim().split('\n');
  return lines.map((line: string) => JSON.parse(line));
}

export function parseLogFile(path: string, type: M.MatchType): MatchLog {
  const log = emptyLog(type);
  const replayer = new Replayer();

  replayer.on(events.GameStep).subscribe((event) => {
    log.addEntry(event);
  });

  replayer.on(events.PlayerAction).subscribe((event) => {
    log.addEntry(event);
  });

  replayer.on(events.RegisterClient).subscribe((event) => {
    log.addEntry(event);
  });

  replayer.replayFile(path);
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
