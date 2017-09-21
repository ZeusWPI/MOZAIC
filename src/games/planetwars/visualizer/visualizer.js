const d3 = require('d3');

const Visuals = require('./visuals');
const Controls = require('./controls');
const { SpaceMath, DataBinder } = require('./util');
const Config = require('./config');


const visuals = new Visuals();

class Visualizer {

  constructor() {
    this.controls = new Controls(this);
    this.visuals = new Visuals('#game');
    this.turn_controller = new TurnController();
  }

  parseJSON(json) {
    var turns = json.trim().split('\n');
    return turns.map(turn => {
      return new Turn(JSON.parse(turn));
    });
  }

  visualize(log) {
    this.clear();
    var turns = this.parseJSON(log);
    this.turn_controller.init(turns);
    // TODO
    //this.visuals.Fleets.animateFleets();
  }

  clear() {
    this.visuals.clearVisuals();
    this.turn_controller.runningbinder.update(false);
  }
}

class TurnController {
  constructor() {
    this.speed = Config.base_speed;
    this.turnbinder = new DataBinder(0);
    this.turnbinder.registerCallback(v => {
      this.running = this._showTurn(v);
    });
    this.runningbinder = new DataBinder(false);
    this.runningbinder.registerCallback(v => {
      if (v) {
        this._startTimer();
      } else {
        this._stopTimer();
      }
    });
    this.turns = [];
  }

  init(turns) {
    this.turns = turns;
    var first_turn = this.turns[0];

    // Generate planet_map
    this.planet_map = first_turn.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    //TODO do this smarter
    turns.forEach((turn, i) => {
      turn.prepareData(this.planet_map);
      if (i > 0) {
        turn.planets.forEach(p1 => {
          turns[i - 1].planets.forEach(p2 => {
            if (p1.name === p2.name && p1.owner !== p2.owner) {
              p1.changed_owner = true;
            }
          });
        });
      }
    });

    var winner = null;
    // Detect winner
    turns[turns.length - 1].planets.forEach(p => {
      if (p.owner != null) {
        winner = p.owner;
      }
    });

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = first_turn.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#d3d3d3";

    visuals.generatePlanetStyles(first_turn.planets);
    visuals.generateViewBox(first_turn.planets);
    visuals.createZoom();
    visuals.generateWinnerBox(winner, this.color_map[winner]);
    this.turnbinder.update(0);
  }

  nextTurn() {
    this.turnbinder.update((this.turnbinder.value) + 1);
  }

  previousTurn() {
    this.turnbinder.update((this.turnbinder.value) - 1);
  }

  _showTurn(newTurn) {
    if (newTurn >= this.turns.length) {
      console.log("end of log");
      this.runningbinder.update(false);
      return false;
    } else {
      var turn = this.turns[newTurn];
      visuals.addNewObjects(turn, this.color_map);
      visuals.update(turn, this);
      return true;
    }
  }

  _startTimer() {
    var callback = elapsed => {
      this.nextTurn();
    };
    this.turn_timer = d3.interval(callback, this.speed);

  }

  _stopTimer() {
    if (this.turn_timer) {
      this.turn_timer.stop();
    }
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

    this.scores = [];
    //TODO this calculation should perhaps be done in the backend
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

module.exports = Visualizer;
