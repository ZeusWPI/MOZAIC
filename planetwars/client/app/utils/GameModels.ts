import { JSONPlanet } from '../lib/match/types';
type LogPath = string;

export type MatchId = string;

interface MatchProperties {
  uuid: MatchId,
  players: string[],
  map: MapId,
  timestamp: Date,
  logPath: string,
}

export type PlayingMatch = MatchProperties & {
  status: 'playing',
}

export type FinishedMatch = MatchProperties & {
  status: 'finished',
  stats: MatchStats,
}

export type ErroredMatch = MatchProperties & {
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
  planets: JSONPlanet[];
}