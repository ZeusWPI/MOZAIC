type LogPath = string;

export type MatchId = string;

interface MatchProperties {
  uuid: MatchId,
  players: string[],
  timestamp: Date,
  logPath: string,
}

type PlayingMatch = MatchProperties & {
  status: 'playing',
}

type FinishedMatch = MatchProperties & {
  status: 'finished',
  stats: MatchStats,
}

type ErroredMatch = MatchProperties & {
  status: 'error',
  error: string,
}

export type Match = PlayingMatch | FinishedMatch | ErroredMatch;


export enum MatchStatus {
  'playing',
  'finished',
  'error',
}


export interface MatchStats {
  winner: number;
  commandsOrdered: number[]; // Number of commands / player;
  planetsFlipped: number;
  shipsSend: number[];
  turns: number;
}

// tslint:disable-next-line:variable-name
export const MatchStatuses = Object.keys(MatchStatus);

export interface IMatchList {
  [matchId: string]: Match;
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

export interface IMapList {
  [key: string /*MapId*/]: IMapMeta;
}

export type MapId = string;

export interface IMapMeta {
  uuid: MapId;
  name: string;
  slots: number;
  mapPath: string;
  createdAt: Date;
}

export interface IMap {
  planets: IPlanet[];
}
