import * as fs from 'fs';

import { IGameData, IGameState } from "../../utils/GameModels";

interface IPlayerData {
  players: string[];
}

export default class GameAnalyser {
  private gameData: IGameData;

  constructor(playerData: IPlayerData, gameLog: IGameState[]) {
    const seenShips = new Set();
    const planetOwners = gameLog[0].planets.map((planet) => planet.owner);
    const shipsSent = [[0]];
    const planetsTaken = new Array(playerData.players.length + 1).fill(0);
    let winner = 0;

    gameLog.map((turn, turnNum) => {
      shipsSent[turnNum] = new Array(playerData.players.length + 1).fill(0);
      turn.expeditions.filter((exp) => !seenShips.has(exp.id))
        .forEach((exp) => {
          seenShips.add(exp.id);
          shipsSent[turnNum][exp.owner] += exp.ship_count;
        });
      turn.planets.forEach((planet, planetIndex) => {
        if (planet.owner && gameLog[Math.max(0, turnNum - 1)].planets[planetIndex].owner !== planet.owner) {
          planetsTaken[planet.owner] += 1;
        }
      });
    });

    const lastTurn = gameLog[gameLog.length - 1];
    const lastPlanetOwners = new Set(lastTurn.planets.map((p) => p.owner).filter((entry) => entry != null));
    const lastExpeditionOwners = new Set(lastTurn.expeditions.map((p) => p.owner).filter((entry) => entry != null));
    if (lastPlanetOwners.size === 1
      && lastExpeditionOwners.size === 1
      && lastPlanetOwners.values().next().value === lastExpeditionOwners.values().next().value) {
      winner = lastPlanetOwners.values().next().value;
    }

    const timestamp = 0; // Not logged yet

    this.gameData = {
      players: playerData.players,
      shipsSent,
      log: {
        players: playerData.players,
        turns: gameLog,
      },
      planetsTaken,
      winner,
      timestamp,
    };
  }

  public static parseGame(path: string): GameAnalyser {
    const contents: string = fs.readFileSync(path, { encoding: "utf8" });
    const lines: string[] = contents.trim().split("\n");
    const gameFile: any = lines.map((value: string) => JSON.parse(value));

    return new GameAnalyser(gameFile[0], gameFile.slice(1));
  }

  public getData(): IGameData {
    return this.gameData;
  }
}
