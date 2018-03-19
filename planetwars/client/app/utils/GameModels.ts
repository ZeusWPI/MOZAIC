type LogPath = string;

export interface IMatchData {
  log: IGameState[];
  meta: IMatchMetaData;
}

export enum MatchStatus {
  'playing',
  'finished',
  'erred',
  'cancelled',
  'imported',
}

// tslint:disable-next-line:variable-name
export const MatchStatuses = Object.keys(MatchStatus);

export interface IMatchList {
  [key: string /* UUID */]: IMatchMetaData;
}

export type MatchId = string;

export interface IMatchMetaData {
  status: MatchStatus;
  uuid: MatchId;
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
