// TODO: Differentiate between internal and external representations
// Rust uses snake_case, but TS uses camelCase, this will cause errors down the
// road.

export interface INamedConfig {
  configName: string;
  config: IMatchConfig;
}

export interface IMatchConfig {
  players: IBotConfig[],
  game_config: IGameConfig,
  log_file: string,
}

interface IGameConfig {
  map_file: string;
  max_turns: number;
}

export type BotID = string;

export interface IBotListv2 {
  [key: string /* UUID */]: IBotDatav2;
}

export interface IBotDatav2 {
  uuid: BotID;
  config: IBotConfig;
  lastUpdatedAt: Date;
  createdAt: Date;
  history: IBotConfig[];
}

export interface IBotConfigv2 {
  name: string;
  command: string;
  args: string;
}

export interface IBotList {
  [key: string /* UUID */]: IBotData;
}

export interface IBotData {
  uuid: BotID;
  config: IBotConfig;
  lastUpdatedAt: Date;
  createdAt: Date;
  history: IBotConfig[];
}

export interface IBotConfig {
  name: string;
  command: string;
}

export function isBotConfig(o: any): o is IBotConfig {
  const c = <IBotConfig> o;
  return (c.command !== undefined)
    && (c.name !== undefined);
}
