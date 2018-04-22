// Schema V1 ------------------------------------------------------------------
// Never used in production

export interface DbSchema { version: 'v1'; }

// Game Models ----------------------------------------------------------------

export type MatchId = string;

export interface MatchProperties {
  uuid: MatchId;
  players: BotId[];
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
  winners: BotId[];
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

export interface MapList {
  [key: string /*MapId*/]: MapMeta;
}

export type MapId = string;

export interface MapMeta {
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

export interface JsonPlanet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

// Config Models --------------------------------------------------------------

export interface MatchConfig {
  players: BotConfig[];
  game_config: GameConfig;
  log_file: string;
}

export interface GameConfig {
  map_file: string;
  max_turns: number;
}

export type BotId = string;

export interface BotList {
  [key: string /* UUID */]: BotData;
}

export interface BotData {
  uuid: BotId;
  config: BotConfig;
  lastUpdatedAt: Date;
  createdAt: Date;
  history: BotConfig[];
}

export interface BotConfig {
  name: string;
  command: string;
  args: string[];
}

// Util Models ----------------------------------------------------------------

export type NotificationType = 'Finished' | 'Error';

export interface Notification {
  title: string;
  body: string;
  link?: string;
  type: NotificationType;
}
