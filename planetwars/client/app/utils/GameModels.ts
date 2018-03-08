type LogPath = string;

export interface IMatchData {
  meta: IMatchMetaData;
  log: IGameState[];
  stats: IMatchStats;
}

export interface IMatchMetaData {
  players: string[];
  logPath?: string;
  timestamp: Date;
}

export interface IMatchStats {
  winner: number;
  planetsTaken: number[];
  shipsSent: number[][];
}

export interface IGameState {
  planets: IPlanet[];
  expeditions: IExpedition[];
}

export interface ILogFormat {
  players: string[];
  turns: IGameState[];
}

// TODO: Switch to camelCase
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
