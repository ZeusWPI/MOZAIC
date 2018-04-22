import * as V1 from './migrationV1';
import * as V3 from './migrationV3';

// Schema V4 ------------------------------------------------------------------

export interface DbSchema {
  version: 'v4';
  matches: MatchList;
  bots: BotList;
  maps: MapList;
  notifications: Notification[];
}

export const defaults = {
  version: 'v4',
  matches: {},
  bots: {},
  maps: {},
  notifications: [],
};

// Game Models ----------------------------------------------------------------

export type MatchId = V1.MatchId;

export type MatchProperties = V1.MatchProperties;

export type PlayingMatch = V1.PlayingMatch;

export type FinishedMatch = V1.FinishedMatch;

export type ErroredMatch = V1.ErroredMatch;

export type Match = V1.Match;

export type MatchStatus = V1.MatchStatus;

export type MatchStats = V1.MatchStats;

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

export interface MatchConfig {
  players: BotSlotList;
  gameConfig: GameConfig;
  logFile: string;
}

export type GameConfig = V3.GameConfig;

export type BotId = V1.BotId;

export type Token = string;

export interface BotSlot {
  id?: BotId; // undefined if it is an external bot
  name: string;
}

// TODO: Make this an array
export interface BotSlotList {
  [key: string /*Token*/]: BotSlot;
}

export type BotList = V3.BotList;

export type BotData = V3.BotData;

export type BotConfig = V3.BotConfig;

// Util Models ----------------------------------------------------------------

export type NotificationType = V1.NotificationType;

export type Notification = V1.Notification;
