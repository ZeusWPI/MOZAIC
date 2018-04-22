/**
 * Note: If you change these things, be sure to add migrations for them.
 */

import { JsonPlanet, isJsonPlanet } from '../lib/match/types';
import { BotID } from './ConfigModels';
type LogPath = string;

export type MatchId = string;

interface MatchProperties {
  uuid: MatchId;
  players: BotID[];
  map: MapId;
  timestamp: Date;
  logPath: string;
}

export type PlayingMatch = MatchProperties & {
  status: 'playing',
};

export type FinishedMatch = MatchProperties & {
  status: 'finished',
  stats: MatchStats,
};

export type ErroredMatch = MatchProperties & {
  status: 'error';
  error: string,
};

export type Match = PlayingMatch | FinishedMatch | ErroredMatch;

export enum MatchStatus {
  'playing',
  'finished',
  'error',
}

export interface MatchStats {
  winners: BotID[];
  score: PlayerMap<number>;
}

export interface PlayerMap<T> {
  [uuid: string]: T;
}

// tslint:disable-next-line:variable-name
export const MatchStatuses = Object.keys(MatchStatus);

export interface MatchList {
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

export interface GameMap {
  // name: string;
  planets: JsonPlanet[];
}

export function isGameMap(obj: any): obj is GameMap {
  const map = obj as GameMap;
  return (
    // (typeof map.name === 'string') &&
    (Array.isArray(map.planets)) &&
    (map.planets.every((p) => isJsonPlanet(p)))
  );
}
