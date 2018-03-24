export interface GameState {
  planets: Planet[];
  expeditions: Expedition[];
}

export interface LogFormat {
  players: string[];
  turns: GameState[];
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  owner: number;
  shipCount: number;
}

export interface Expedition {
  id: number;
  origin: Planet;
  target: Planet;
  shipCount: number;
  owner: number;
  turnsRemaining: number;
}

// TODO: Switch to camelCase
export interface JSONPlanet {
  "ship_count": number;
  "x": number;
  "y": number;
  "owner": number;
  "name": string;
}

export interface JSONExpedition {
  "id": number;
  "ship_count": number;
  "origin": string;
  "destination": string;
  "owner": number;
  "turns_remaining": number;
}
