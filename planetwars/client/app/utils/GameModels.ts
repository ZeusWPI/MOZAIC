type LogPath = string;

export interface IGameData {
  players: string[];
  winner: number;
  // log: LogPath | IGameLog;
  log: IGameLog;
  planetsTaken: number[];
  shipsSent: number[][];
  timestamp: number;
}

export interface IGameLog {
  players: string[];
  turns: IGameState[];
}

export interface IGameState {
  planets: IPlanet[];
  expeditions: IExpedition[];
}

interface IPlanet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

interface IExpedition {
  "id": number;
  "ship_count": number;
  "origin": string;
  "destination": string;
  "owner": number;
  "turns_remaining": number;
}
