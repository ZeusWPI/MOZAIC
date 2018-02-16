import * as fs from 'fs';

import { GameData, GameState } from "./GameData"

interface PlayerData {
  players: string[]
}

export default class GameAnalyser {
  gameData:GameData;

  static parseGame(path:string) {
    let contents:string = fs.readFileSync(path, { encoding:"utf8" });
    let lines:string[] = contents.trim().split("\n");
    let gameFile:any = lines.map((value:string) => JSON.parse(value));

    return new GameAnalyser(gameFile[0], gameFile.slice(1));
  }

  constructor(playerData:PlayerData, gameLog:GameState[]) {
    let seenShips = new Set()
    let planetOwners = gameLog[0].planets.map((planet) => planet.owner)
    let shipsSent = [[0]]
    let planetsTaken = new Array(playerData.players.length + 1).fill(0)
    let winner = 0

    gameLog.map((turn, turnNum) => {
      shipsSent[turnNum] = new Array(playerData.players.length + 1).fill(0)
      turn.expeditions.filter((exp) => !seenShips.has(exp.id))
                      .map((exp) => {
        seenShips.add(exp.id)
        shipsSent[turnNum][exp.owner] += exp.ship_count
      })
      turn.planets.map((planet, planetIndex) => {
        if(planet.owner && gameLog[Math.max(0,turnNum - 1)].planets[planetIndex].owner != planet.owner)
        {
          planetsTaken[planet.owner] += 1
        }
      })
    })
    let lastTurn = gameLog[gameLog.length - 1]
    let lastPlanetOwners = new Set(lastTurn.planets.map((p) => p.owner).filter((entry) => entry != null))
    let lastExpeditionOwners = new Set(lastTurn.expeditions.map((p) => p.owner).filter((entry) => entry != null))
    if(lastPlanetOwners.size == 1 && lastExpeditionOwners.size == 1 && lastPlanetOwners.values().next().value == lastExpeditionOwners.values().next().value)
    {
      winner = lastPlanetOwners.values().next().value
    }

    let timestamp = 0 // Not logged yet

    this.gameData = {
      players: playerData.players,
      shipsSent: shipsSent,
      gameLog: gameLog,
      planetsTaken: planetsTaken,
      winner: winner,
      timestamp: timestamp
    }
  }

  getData() {
    return this.gameData;
  }
}
