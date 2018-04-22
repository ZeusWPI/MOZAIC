/**
 * Note: If you change these things, be sure to add migrations for them.
 */

export interface MatchConfig {
  players: BotSlotList;
  gameConfig: GameConfig;
  logFile: string;
}

export interface GameConfig {
  mapFile: string;
  maxTurns: number;
}

export type BotId = string;
export type Token = string; // not sure if this is a string...

export interface BotSlot {
  id?: BotId; // undefined if it is an external bot
  name: string;
}

export interface BotSlotList {
  [key: string /*Token*/]: BotSlot;
}

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

export function isBotConfig(o: any): o is BotConfig {
  const c = o as BotConfig;
  return (typeof c.command === 'string')
    && (typeof c.name === 'string');
}
