export interface Player {
  name: string,
  color: any,
  ship_count: number,
  planet_count: number
}

export interface TurnData {
  planets: PlanetData[],
  expeditions: ExpeditionData[]
}

export interface Planet {
  ship_count: number,
  x: number,
  y: number,
  owner: Player,
  name: string,
  size: number
}

export interface PlanetData {
  ship_count: number,
  x: number,
  y: number,
  owner: number,
  name: string,
}

export interface ExpeditionData {
  id: number,
  ship_count: number
  origin: string,
  destination: string,
  owner: number,
  turns_remaining: number
}

export interface Expedition {
  id: number,
  ship_count: number
  origin: Planet,
  destination: Planet,
  owner: Player,
  turns_remaining: number
}
