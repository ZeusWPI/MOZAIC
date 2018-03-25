type LogPath = string;

export type MatchId = string;

interface MatchProperties {
  uuid: MatchId;
  players: string[];
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
  status: 'error',
  error: string,
};

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
  planets: Planet[];
  expeditions: IExpedition[];
}

export interface ILogFormat {
  players: string[];
  turns: IGameState[];
}

// TODO: Switch to camelCase
export interface Planet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

export function isPlanet(obj: any): obj is Planet {
  const planet = obj as Planet;
  return (
    (typeof planet.ship_count === 'number') &&
    (typeof planet.x === 'number') &&
    (typeof planet.y === 'number') &&
    (typeof planet.owner === 'number' ||
      typeof planet.owner === 'undefined' ||
      planet.owner === null) &&
    (typeof planet.name === 'string')
  );
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

export interface GameMap {
  name: string;
  planets: Planet[];
}

export function isGameMap(obj: any): obj is GameMap {
  const map = obj as GameMap;
  return (
    (typeof map.name === 'string') &&
    (Array.isArray(map.planets)) &&
    (map.planets.every((p) => isPlanet(p)))
  );
}
