import { Player, Planet, PlanetData, Expedition, ExpeditionData, TurnData} from "./interfaces"
import Game from "./game"

export default class Turn {
  game: Game;
  playerMap:Player[];
  planetMap:Map<string, Planet>;
  players: Player[];
  planets: Planet[];
  expeditions: Expedition[];

  constructor(turn:TurnData, game:Game) {
    this.game = game;
    this.playerMap = [];
    this.planetMap = new Map();

    //this.players = this.initPlayers(game.players);
    this.planets = this.parsePlanets(turn.planets);
    this.expeditions = this.parseExpeditions(turn.expeditions);
    this.calculateScores();
  }

  initPlayers(player_names: string[]) {
    return player_names.map((name:string, index:number) => {
      let player = {
        name: name,
        color: this.game.playerColor(name),
        // these are calculated in calculateScores.
        ship_count: 0,
        planet_count: 0
      };
      this.playerMap[index] = player;
      return player;
    });
  }

  parsePlanets(planet_reprs:PlanetData[]) {
    return planet_reprs.map(planet_repr => {
      let planet:Planet = this.parsePlanet(planet_repr);
      this.planetMap.set(planet.name, planet);
      return planet;
    });
  }

  parsePlanet(repr:PlanetData) {
    return {
      name: repr.name,
      x: repr.x,
      y: repr.y,
      ship_count: repr.ship_count,
      owner: this.playerMap[repr.owner - 1],
      type: this.game.planetType(repr.name),
      size: 1
    };
  }

  parseExpeditions(exp_reprs:ExpeditionData[]) {
    return exp_reprs.map(repr => {
      return {
        id: repr.id,
        origin: this.planetMap.get(repr.origin) as Planet,
        destination: this.planetMap.get(repr.destination) as Planet,
        ship_count: repr.ship_count,
        owner: this.playerMap[repr.owner - 1],
        turns_remaining: repr.turns_remaining
      };
    });
  }

  calculateScores() {
    this.planets.forEach(planet => {
      if (planet.owner) {
        planet.owner.ship_count += planet.ship_count;
        planet.owner.planet_count += 1;
      }
    });
    this.expeditions.forEach(exp => {
      exp.owner.ship_count += exp.ship_count;
    });
  }
}
