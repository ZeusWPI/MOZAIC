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

  constructor(playerData:PlayerData, gameFile:GameState[]) {
    let shipsSent = [[0]]
    let planetsTaken = [0]
    let winner= 0
    let timestamp = 0

    this.gameData = {
      players: playerData.players,
      shipsSent: shipsSent,
      gameLog: gameFile,
      planetsTaken: planetsTaken,
      winner: winner,
      timestamp: timestamp
    }
  }

  getData() {
    return this.gameData;
  }
}
