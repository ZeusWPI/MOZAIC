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

export type MatchId = string;

export type Match = HostedMatch | JoinedMatch;
export type HostedMatch =
  PlayingHostedMatch |
  ErroredHostedMatch |
  FinishedHostedMatch;

export type JoinedMatch =
  PlayingJoinedMatch |
  ErroredJoinedMatch |
  FinishedJoinedMatch;

export type Playing = { status: 'playing' };
export type Finished = { status: 'finished' };
export type Errored = { status: 'error'; error: string };

export interface HostedMatchProps {
  status: MatchStatus;
  uuid: MatchId;
  players: BotSlotList;
  maxTurns: number;
  timestamp: Date;
  logPath: string;
  map: MapId;
  network: NetworkConfig;
}

export type PlayingHostedMatch = HostedMatchProps & Playing;
export type ErroredHostedMatch = HostedMatchProps & Errored;
export type FinishedHostedMatch = HostedMatchProps & Finished & {
  stats: MatchStats;
};

export interface JoinedMatchProps {
  status: MatchStatus;
  uuid: MatchId; // Different from Hosted match id
  localPlayers: InternalBotSlot[];
  timestamp: Date;
  network: NetworkConfig;
}

export type PlayingJoinedMatch = JoinedMatchProps & Playing;
export type FinishedJoinedMatch = JoinedMatchProps & Finished & {
  importedLog?: { logPath: string; stats: MatchStats; playerNames: string[] };
};
export type ErroredJoinedMatch = JoinedMatchProps & Errored & {
  importedLog?: { logPath: string; }
};

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
export const MatchStatuses = V1.MatchStatuses;

export type MatchList = V1.MatchList;

export type MapList = V1.MapList;

export type MapId = V1.MapId;

export type MapMeta = V1.MapMeta;

export type GameMap = V1.GameMap;

export const isGameMap = V1.isGameMap;

export type JsonPlanet = V1.JsonPlanet;

export type BotId = V1.BotId;

export type BotList = V3.BotList;

export interface Bot {
  uuid: BotId;
  lastUpdatedAt: Date;
  createdAt: Date;
  name: string;
  command: string;
}

export type Token = string;

export type BotSlot = ExternalBotSlot | InternalBotSlot;

export interface BotSlotProperties {
  type: 'internal' | 'external';
  token: Token;
}

export type ExternalBotSlot = BotSlotProperties & {
  type: 'external';
  name: string;
};

export interface InternalBotSlot {
  type: 'internal';
  botId: BotId;
}

export interface BotSlotList {
  [key: string /*Token*/]: BotSlot;
}

// Config Models --------------------------------------------------------------

export interface MatchConfig {
  players: PlayerConfig[];
  gameConfig: GameConfig;
  logFile: string;
}

export interface PlayerConfig {
  token: Token;
  name: string;
}

export type GameConfig = V3.GameConfig;

// Util Models ----------------------------------------------------------------

export type NotificationType = V1.NotificationType;

export type Notification = V1.Notification;

export interface NetworkConfig {
  ip: string;
  port: string;
}
