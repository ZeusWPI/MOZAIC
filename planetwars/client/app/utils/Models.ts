// General GameState
export interface Planet {
  x: number,
  y: number,
  owner: number,
  ship_count: number,
  name: string
}

export interface Expedition {
  id: number,
  ship_count: number,
  origin: string,
  destination: string,
  owner: number,
  turns_remaining: number
}

export interface GameState {
  planets: Planet[],
  expeditions: Expedition[]
}

// Used in Play.ts
export interface NamedConfig {
  configName: string,
  config: MatchConfig,
}

export interface MatchConfig {
  players: BotConfig[],
  game_config: GameConfig,
}

interface GameConfig {
  map_file: string,
  max_turns: number,
}

export interface BotConfig {
  name: string,
  command: string,
  args: string[],
}

export function isBotConfig(o: any): o is BotConfig {
  const c = <BotConfig>o;
  return (c.command != undefined)
    && (c.name != undefined)
    && (c.args != undefined);
}

// Used in GameData.ts
export interface GameMetrics {
  players: string[],
  winner: number,
  gameLog: GameState[],
  planetsTaken: number[],
  shipsSent: number[][],
  // use Date instead of number
  timestamp: number
}

export interface GameLog {
  players: string[],
  turns: GameState[]
}
