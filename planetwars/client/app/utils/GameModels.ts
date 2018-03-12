type LogPath = string;

export interface IMatchData {
  log: IGameState[];
  meta: IMatchMetaData;
}

export interface IMatchMetaData {
  uuid: string;
  players: string[];
  logPath?: string;
  stats: IMatchStats;
  timestamp: Date;
}

export interface IMatchStats {
  winner: number;
  commandsOrdered: number[]; // Number of commands / player;
  planetsFlipped: number;
  shipsSend: number[];
  turns: number;
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
export interface IPlanet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

export interface IExpedition {
  "id": number;
  "ship_count": number;
  "origin": string;
  "destination": string;
  "owner": number;
  "turns_remaining": number;
}
