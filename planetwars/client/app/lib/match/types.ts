export interface GameState {
  planets: PlanetList;
  expeditions: Expedition[];
}

export interface LogFormat {
  players: string[];
  turns: GameState[];
}

export interface Player {
  uuid: string;
  name: string;
  score: number;
}

export interface PlanetList {
  [name: string]: Planet;
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  owner?: Player;
  shipCount: number;
}

export interface Expedition {
  id: number;
  origin: Planet;
  destination: Planet;
  owner: Player;
  shipCount: number;
  turnsRemaining: number;
}

// TODO: Switch to camelCase
export interface JsonGameState {
  planets: JsonPlanet[];
  expeditions: JsonExpedition[];
}

export interface JsonCommand {
  "origin": string;
  "destination": string;
  "ship_count": string;
}

export interface JsonPlanet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

export interface JsonExpedition {
  "id": number;
  "origin": string;
  "destination": string;
  "owner": number;
  "ship_count": number;
  "turns_remaining": number;
}
