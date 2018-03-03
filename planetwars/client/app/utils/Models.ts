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
