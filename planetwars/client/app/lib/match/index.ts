import { MatchLog } from '.';

export { MatchLog, PlayerMap, parseLog } from './MatchLog';
export * from './types';
// TODO: this is not exactly ideal
export { PwTypes } from 'mozaic-client';

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
