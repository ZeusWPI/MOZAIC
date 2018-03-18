// TODO: Differentiate between internal and external representations
// Rust uses snake_case, but TS uses camelCase, this will cause errors down the
// road.

export interface INamedConfig {
  configName: string;
  config: IMatchConfig;
}

export interface IMatchConfig {
  players: IBotConfig[];
  game_config: IGameConfig;
}

interface IGameConfig {
  map_file: string;
  max_turns: number;
}

export type BotID = string;

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
  args: string[];
}

export function isBotConfig(o: any): o is IBotConfig {
  const c = <IBotConfig> o;
  return (c.command !== undefined)
    && (c.name !== undefined)
    && (c.args !== undefined);
}
