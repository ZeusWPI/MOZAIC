import { ILogFormat, IMatchStats } from './GameModels';

export class MatchAnalyser {

  public static analyseSync(match: ILogFormat): IMatchStats {
    const { players, turns } = match;

    const seenShips = new Set();
    // TODO Handle players having no initial planets, only expeditions
    const planetOwners = turns[0].planets.map((planet) => planet.owner);
    const shipsSent = [[0]];
    const planetsTaken = new Array(players.length + 1).fill(0);
    let winner = 0;

    turns.map((turn, turnNum) => {
      shipsSent[turnNum] = new Array(players.length + 1).fill(0);
      turn.expeditions.filter((exp) => !seenShips.has(exp.id))
        .forEach((exp) => {
          seenShips.add(exp.id);
          shipsSent[turnNum][exp.owner] += exp.ship_count;
        });
      turn.planets.forEach((planet, planetIndex) => {
        if (planet.owner && turns[Math.max(0, turnNum - 1)].planets[planetIndex].owner !== planet.owner) {
          planetsTaken[planet.owner] += 1;
        }
      });
    });

    const lastTurn = turns[turns.length - 1];
    const lastPlanetOwners = new Set(lastTurn.planets.map((p) => p.owner).filter((entry) => entry != null));
    const lastExpeditionOwners = new Set(lastTurn.expeditions.map((p) => p.owner).filter((entry) => entry != null));
    if (lastPlanetOwners.size === 1
      && lastExpeditionOwners.size === 1
      && lastPlanetOwners.values().next().value === lastExpeditionOwners.values().next().value) {
      winner = lastPlanetOwners.values().next().value;
    }

    return { planetsTaken, winner, shipsSent };
  }
}
