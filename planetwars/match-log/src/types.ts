
// TODO: Shit to clean up -----------------------------------------------------

export enum MatchType {
  "hosted",
  "joined"
}

export interface MatchStats {
  winners: number[]
  score: { [playerNum: number]: number }
}

// Top Level ------------------------------------------------------------------

export interface LogFormat {
  players: string[];
  turns: GameState[];
}

// Output ---------------------------------------------------------------------

export interface GameState {
  planets: PlanetList;
  expeditions: Expedition[];
}


export interface Player {
  uuid: string;
  name: string;
  number: number;
  score: number;
}

export interface PlanetList {
  [name: string]: Planet;
}

export interface Planet {
  name: string;
  x: number;
  y: number;
  owner?: number;
  shipCount: number;
}

export interface Expedition {
  id: number;
  origin: Planet;
  destination: Planet;
  owner: number;
  shipCount: number;
  turnsRemaining: number;
}

// Input ----------------------------------------------------------------------

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

export function isJsonPlanet(obj: any): obj is JsonPlanet {
  const planet = obj as JsonPlanet;
  return (
    (typeof planet.ship_count === 'number') &&
    (typeof planet.x === 'number') &&
    (typeof planet.y === 'number') &&
    (typeof planet.owner === 'number' ||
      typeof planet.owner === 'undefined' ||
      planet.owner === null) &&
    (typeof planet.name === 'string')
  );
}

export interface JsonExpedition {
  "id": number;
  "origin": string;
  "destination": string;
  "owner": number;
  "ship_count": number;
  "turns_remaining": number;
}
