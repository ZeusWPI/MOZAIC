// TODO: Differentiate between internal and external representations
// Rust uses snake_case, but TS uses camelCase, this will cause errors down the
// road.

export interface MatchConfig {
  players: BotConfig[];
  gameConfig: GameConfig;
  logFile: string;
}

export interface GameConfig {
  mapFile: string;
  maxTurns: number;
}

export type BotID = string;

export interface IBotList {
  [key: string /* UUID */]: IBotData;
}

export interface IBotData {
  uuid: BotID;
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
