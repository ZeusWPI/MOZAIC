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

export type Playing = { status: MatchStatus.playing };
export type Finished = { status: MatchStatus.finished; stats: MatchStats; };
export type Errored = { status: MatchStatus.error; error: string };

export interface MatchProps {
  type: MatchType;
  status: MatchStatus;
  uuid: string;
  timestamp: Date;
  network: Address;
  logPath: string;
}

export type FinishedMatch = FinishedHostedMatch | FinishedJoinedMatch;
export type ErroredMatch = ErroredHostedMatch | ErroredJoinedMatch;

export type HostedMatchProps = MatchProps & {
  type: MatchType.hosted;
  players: BotSlot[];
  maxTurns: number;
  map: MapId;
};

export type PlayingHostedMatch = HostedMatchProps & Playing;
export type ErroredHostedMatch = HostedMatchProps & Errored;
export type FinishedHostedMatch = HostedMatchProps & Finished;

export type JoinedMatchProps = MatchProps & {
  type: MatchType.joined;
  bot: InternalBotSlot;
};

export type PlayingJoinedMatch = JoinedMatchProps & Playing;
export type FinishedJoinedMatch = JoinedMatchProps & Finished & {
  // importedLog?: { logPath: string; stats: MatchStats; playerNames: string[] };
};
export type ErroredJoinedMatch = JoinedMatchProps & Errored & {
  // importedLog?: { logPath: string; },
};

export enum MatchType {
  'hosted',
  'joined',
}

export enum MatchStatus {
  'playing',
  'finished',
  'error',
}

export interface MatchStats {
  winners: number[];
  score: PlayerMap<number>;
}

export interface PlayerMap<T> {
  [uuid: string]: T;
}

export interface MatchParams {
  players: BotSlot[];
  map: MapId;
  maxTurns: number;
  address: Address;
}

// tslint:disable-next-line:variable-name
export const MatchStatuses = V1.MatchStatuses;

export interface MatchList {
  [matchId: string]: Match;
}

export type MapList = V1.MapList;

export type MapId = V1.MapId;

export type MapMeta = V1.MapMeta;

export type GameMap = V1.GameMap;

export const isGameMap = V1.isGameMap;

export type JsonPlanet = V1.JsonPlanet;

export type BotId = V1.BotId;

export interface BotList {
  [key: string /* UUID */]: Bot;
}

export interface Bot {
  uuid: BotId;
  lastUpdatedAt: Date;
  createdAt: Date;
  name: string;
  command: string;
}

export type Token = string;

export type BotSlot = ExternalBotSlot | InternalBotSlot;

export interface BotSlotProps {
  type: 'internal' | 'external';
  token: Token;
  connected: boolean; // Maybe more info?
}

export type ExternalBotSlot = BotSlotProps & {
  type: 'external';
  name: string;
};

export type InternalBotSlot = BotSlotProps & {
  type: 'internal';
  botId: BotId;
  name: string;
};

// Config Models --------------------------------------------------------------

export interface MatchConfig {
  players: PlayerConfig[];
  gameConfig: GameConfig;
  address: string;
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

export interface Address {
  host: string;
  port: number;
}
