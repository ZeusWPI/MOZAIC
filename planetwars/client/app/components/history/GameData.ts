export interface GameData {
  players: string[],
  winner: number,
  gameLog: GameState[],
  planetsTaken: number[],
  shipsSent: number[][],
  timestamp: number
}

export interface GameState {
  planets: Planet[],
  expeditions: Expedition[]
}

interface Planet {
  "ship_count": number,
  "x": number,
  "y": number,
  "owner": number,
  "name": string
}

interface Expedition {
  "id": number,
  "ship_count": number,
  "origin": string,
  "destination": string,
  "owner": number,
  "turns_remaining": number
}
