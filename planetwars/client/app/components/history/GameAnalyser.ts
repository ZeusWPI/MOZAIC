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
    let shipsSent = [[0]]
    gameLog.map((turn, turnNum) => {
      shipsSent[turnNum] = new Array(playerData.players.length + 1).fill(0);
      turn.expeditions.filter((exp) => !seenShips.has(exp.id)).map((exp) => {
        // console.log(turnNum, exp.owner)
        seenShips.add(exp.id)
        shipsSent[turnNum][exp.owner] += exp.ship_count
      })
    })
    // console.log(shipsSent)
    let planetsTaken = [0]
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
