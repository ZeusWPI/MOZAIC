const d3 = require('d3');

const Config = require('./config');
const Utils = require('./util');
const DataBinder = Utils.DataBinder;
const space_math = Utils.SpaceMath;

class Game {
  constructor() {
    this.winner = null;
  }

  parseJSON(json) {
    var turns = json.trim().split('\n');
    return turns.map(turn => {
      return new Turn(JSON.parse(turn));
    });
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

  reset() {
    this.speed_binder.update(Config.base_speed);
    this.turn_binder.update(0);
    this.run_binder.update(false);
    this.winner = null;
  }

  get maxTurns() {
    if (!this.turns) return 0;
    return this.turns.length - 1;
  }
}

class Turn {
  constructor(turn) {
    this.planets = turn.planets.map(planet => {
      return new Planet(planet);
    });
    this.expeditions = turn.expeditions.map(exp => {
      return new Expedition(exp);
    });
    this.calculateTurnScore(turn.players);
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

class Planet {
  constructor(log_planet) {
    this.name = log_planet.name;
    this.x = log_planet.x;
    this.y = log_planet.y;
    this.ship_count = log_planet.ship_count;
    this.owner = log_planet.owner;
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
