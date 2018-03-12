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
