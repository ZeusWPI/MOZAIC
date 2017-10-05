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
    return '#ff0000';
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
    this.expeditions = [];
  }

  parsePlayers(player_names) {
    return player_names.map(name => {
      let player = {
        name: name,
        color: this.game.playerColor(name)
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

  calculateTurnScore(players) {
    this.players = [];
    var strengths = [];
    var total_strength = 0;

    players.forEach(player => {
      var planets = 0;
      var strength = 0;
      this.planets.forEach(planet => {
        if (planet.owner === player) {
          strength += planet.ship_count;
          planets++;
        }
      });
      var expeditions = 0;
      this.expeditions.forEach(exp => {
        if (exp.owner === player) {
          strength += exp.ship_count;
          expeditions++;
        }
      });
      this.players.push({
        player: player,
        planets: planets,
        expeditions: expeditions
      });
      total_strength += strength;
      strengths.push(strength);
    });
    this.players.forEach(s => {
      s.strengths = strengths;
      s.total_strength = total_strength;
    });
  }

  prepareData(planet_map) {
    if (this.prepared) return;
    this.expeditions.map(exp => {
      exp.origin = planet_map[exp.origin];
      exp.destination = planet_map[exp.destination];
    });
  }
}


class Expedition {
  constructor(log_exp) {
    this.id = log_exp.id;
    this.origin = log_exp.origin;
    this.destination = log_exp.destination;
    this.ship_count = log_exp.ship_count;
    this.owner = log_exp.owner;
    this.turns_remaining = log_exp.turns_remaining;
  }
}

module.exports = Game;
