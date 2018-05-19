import * as V1 from './migrationV1';
import * as V2 from './migrationV1';

// Schema V3 ------------------------------------------------------------------

export interface DbSchema {
  version: 'v3';
  matches: MatchList;
  bots: BotList; // This changed from V1
  maps: MapList;
  notifications: Notification[];
}

// Game Models ----------------------------------------------------------------

export type MatchId = V1.MatchId;

export type MatchProperties = V1.MatchProperties;

export type PlayingMatch = V1.PlayingMatch;

export type FinishedMatch = V1.FinishedMatch;

export type ErroredMatch = V1.ErroredMatch;

export type Match = V1.Match;

export type MatchStatus = V1.MatchStatus;

export type MatchStats = V1.MatchStatus;

export type PlayerMap<T> = V1.PlayerMap<T>;

// tslint:disable-next-line:variable-name
export const MatchStatuses = V1.MatchStatuses;

export type MatchList = V1.MatchList;

export type MapList = V1.MapList;

export type MapId = V1.MapId;

export type MapMeta = V1.MapMeta;

export type GameMap = V1.GameMap;

export const isGameMap = V1.isGameMap;

export type JsonPlanet = V1.JsonPlanet;

// Config Models --------------------------------------------------------------

export type MatchConfig = V1.MatchConfig;

export interface GameConfig {
  mapFile: string;
  maxTurns: number;
}

export type BotId = V1.BotId;

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
}

// Util Models ----------------------------------------------------------------

export type NotificationType = V1.NotificationType;

export type Notification = V1.Notification;
