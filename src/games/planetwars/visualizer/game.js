const d3 = require('d3');

const Config = require('./config');
const Utils = require('./util');
const DataBinder = Utils.DataBinder;
const space_math = Utils.SpaceMath;



class Game {
  constructor() {
    this.speed_binder = new DataBinder(Config.base_speed);
    this.turn_binder = new DataBinder(0);
    this.run_binder = new DataBinder(false);
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
    //this.generatePlanetStyles(first_turn.planets);

    // Generate planet_map
    this.planet_map = first_turn.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    //Turn preprocessing
    this.turns.forEach(turn => {
      turn.prepareData(this.planet_map);
    });

    // Detect winner
    this.turns[this.turns.length - 1].planets.forEach(p => {
      if (p.owner != null) {
        this.winner = p.owner;
      }
    });

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = first_turn.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#d3d3d3";
  }

  get maxTurns() {
    return this.turns.length - 1;
  }
}

class Turn {
  constructor(turn) {
    this.players = turn.players;
    this.planets = turn.planets.map(planet => {
      return new Planet(planet);
    });
    this.expeditions = turn.expeditions.map(exp => {
      return new Expedition(exp);
    });
    this.calculateTurnScore();
  }

  calculateTurnScore() {
    //TODO this calculation should perhaps be done in the backend
    this.scores = [];
    var strengths = [];
    var total_strength = 0;
    this.players.forEach(player => {
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
      this.scores.push({
        player: player,
        planets: planets,
        expeditions: expeditions
      });
      total_strength += strength;
      strengths.push(strength);
    });
    this.scores.forEach(s => {
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

  position() {
    var total_distance = Math.ceil(space_math.euclideanDistance(this.origin, this.destination));
    var mod = this.turns_remaining / total_distance;

    var new_x = this.origin.x - this.destination.x;
    new_x *= mod;
    new_x += this.destination.x;

    var new_y = this.origin.y - this.destination.y;
    new_y *= mod;
    new_y += this.destination.y;

    return {
      'x': new_x,
      'y': new_y
    };
  }

  angle() {
    return (Math.atan2(this.destination.y - this.origin.y, this.destination.x - this.origin.x) * (180 / Math.PI) + 45) % 360;
  }

  homannPosition(angle) {
    var total_distance = space_math.euclideanDistance(this.origin, this.destination);
    if (!angle) angle = this.homannAngle(this.turns_remaining, total_distance);

    var r1 = (this.origin.size) / 2 + 3;
    var r2 = (this.destination.size) / 2 + 3;

    var a = (total_distance + r1 + r2) / 2;
    var c = a - r1 / 2 - r2 / 2;
    var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

    var dx = this.origin.x - this.destination.x;
    var dy = this.origin.y - this.destination.y;
    var w = Math.atan2(dy, dx);

    var center_x = c * Math.cos(w) + this.destination.x;
    var center_y = c * Math.sin(w) + this.destination.y;

    var longest = a;
    var shortest = b;

    longest *= Math.cos(angle);
    shortest *= Math.sin(angle);

    return {
      'x': center_x + longest * Math.cos(w) - shortest * Math.sin(w),
      'y': center_y + longest * Math.sin(w) + shortest * Math.cos(w)
    };
  }

  homannAngle(turn, distance) {
    if (!distance) distance = space_math.euclideanDistance(this.origin, this.destination);
    var mod = turn / distance;
    return mod * (Math.PI * 2) - Math.PI;
  }
}

module.exports = Game;
