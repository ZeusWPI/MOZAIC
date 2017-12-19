
export interface NamedConfig {
  configName: string,
  config: MatchConfig,
}

// Note the distinction in casing between MatchConfig and the config schema.
export interface MatchConfig {
  players: PlayerConfig[],
  game_config: GameConfig,
}

interface GameConfig {
  map_file: string,
  max_turns: number,
}

export interface PlayerConfig {
  name: string,
  cmd: string,
  args: string[],
}
