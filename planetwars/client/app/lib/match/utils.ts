import * as M from '../../database/models';
import * as fs from 'fs';
import { MatchLog, HostedMatchLog, JoinedMatchLog } from './MatchLog';
import { Replayer, SimpleEventEmitter, events } from "mozaic-client";

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

  registerStreamToLog(log, replayer);

  replayer.clientSpottedDispatcher.subscribe((clientId) => {
    log.addPlayer(clientId);
    registerStreamToLog(log, replayer.clientStream(clientId));
  });

  replayer.replayFile(path);
  return log;
}

function registerStreamToLog(log: MatchLog, stream: Replayer | SimpleEventEmitter) {
  stream.on(events.GameStep).subscribe((event) => {
    log.addEntry(event);
  });

  stream.on(events.PlayerAction).subscribe((event) => {
    log.addEntry(event);
  });

  stream.on(events.RegisterClient).subscribe((event) => {
    log.addEntry(event);
  });
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
