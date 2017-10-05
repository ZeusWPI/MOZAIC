const d3 = require('d3');

const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;

class Game {
  constructor(json) {
    this.winner = null;
    let turns_json = json.trim().split('\n');
    this.playerColors = d3.scaleOrdinal(d3.schemeCategory10);
    
    this.turns = turns_json.map(turn_json => {
      let obj = JSON.parse(turn_json);
      return new Turn(obj, this);
    });
  }

  playerColor(name) {
    return this.playerColors(name);
  }

  init(log) {
    this.turns = this.parseJSON(log);
    var first_turn = this.turns[0];

    // Generate planet_map
    var planet_map = first_turn.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    //Turn preprocessing
    this.turns.forEach(turn => {
      turn.prepareData(planet_map);
    });

    // Detect winner
    this.turns[this.turns.length - 1].planets.forEach(p => {
      if (this.winner != null && this.winner != p.owner) {
        this.winner = Config.visual_null;
      }
      if (p.owner != null && this.winner != Config.visual_null) {
        this.winner = p.owner;
      }
    });
  }
}

class Turn {
  constructor(turn, game) {
    this.game = game;
    this.playerMap = new Map();
    this.planetMap = new Map();

    this.players = this.parsePlayers(turn.players);
    this.planets = this.parsePlanets(turn.planets);
    this.expeditions = this.parseExpeditions(turn.expeditions);
    this.calculateScores();
  }

  parsePlayers(player_names) {
    return player_names.map(name => {
      let player = {
        name: name,
        color: this.game.playerColor(name),
        // these are calculated in calculateScores.
        ship_count: 0,
        planet_count: 0
      };
      this.playerMap.set(name, player);
      return player;
    });
  }

  parsePlanets(planet_reprs) {
    return planet_reprs.map(planet_repr => {
      let planet = this.parsePlanet(planet_repr);
      this.planetMap.set(planet.name, planet);
      return planet;
    });
  }
  
  parsePlanet(repr) {
    return {
      name: repr.name,
      x: repr.x,
      y: repr.y,
      ship_count: repr.ship_count,
      owner: this.playerMap.get(repr.owner)
    };
  }

  parseExpeditions(exp_reprs) {
    return exp_reprs.map(repr => {
      return {
        id: repr.id,
        origin: this.planetMap.get(repr.origin),
        destination: this.planetMap.get(repr.destination),
        ship_count: repr.ship_count,
        owner: this.playerMap.get(repr.owner),
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

module.exports = Game;
