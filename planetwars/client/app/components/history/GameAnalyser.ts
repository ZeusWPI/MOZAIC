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
    gameLog.map((turn, turnNum) => {
      shipsSent[turnNum] = new Array(playerData.players.length + 1).fill(0)
      turn.expeditions.filter((exp) => !seenShips.has(exp.id))
                      .map((exp) => {
        seenShips.add(exp.id)
        shipsSent[turnNum][exp.owner] += exp.ship_count
      })
      let prevPlanetOwners = planetOwners.slice(0)
      planetOwners = turn.planets.map((planet) => planet.owner)
      for (let i in planetOwners)
      {
        if(planetOwners[i] != prevPlanetOwners[i] && planetOwners[i] != null)
        {
          planetsTaken[planetOwners[i]] += 1
        }
      }
    })
    let winner = 0
    let timestamp = 0 // TODO

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
