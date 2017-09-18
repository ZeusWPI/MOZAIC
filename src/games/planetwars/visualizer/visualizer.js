const space_math = new SpaceMath();
const visuals = new Visuals();

class Visualizer {

  constructor(log) {
    this.turn_controller = new TurnController();
    var turns = this.parseJSON(log);
    this.turn_controller.init(turns);
    Visuals.Fleets.animateFleets();
  }

  parseJSON(json) {
    var turns = json.trim().split('\n');
    return turns.map(turn => {
      return new Turn(JSON.parse(turn));
    });
  }

  clear() {
    Visuals.clearVisuals();
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
    Visuals.ResourceLoader.setupPatterns();
    Visuals.clearVisuals();

    var first_turn = this.turns[0];

    // Generate planet_map
    this.planet_map = first_turn.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = first_turn.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#d3d3d3";

    visuals.generatePlanetStyles(first_turn.planets);
    visuals.generateViewBox(first_turn.planets);
    this.turnbinder.update(0);
  }

  nextTurn() {
    this.turnbinder.update(this.turnbinder.value + 1);
  }

  previousTurn() {
    this.turnbinder.update(this.turnbinder.value - 1);
  }

  _showTurn(newTurn) {
    if (newTurn >= this.turns.length) {
      console.log("end of log");
      this.runningbinder.update(false);
      return false;
    } else {
      var turn = this.turns[newTurn];
      turn.prepareData(this.planet_map);
      visuals.addNewObjects(turn, this.color_map);
      visuals.update(turn, this);
      return true;
    }
  }

  _startTimer() {
    // Toggle makes sure the timer doesn't trigger twice on fast computers
    var timeToggled = false;
    var callback = e => {
      // 20 might seem like a magic number
      // D3 docs say it will at least take 15 ms to draw frame
      if (e % this.speed < 20) {
        if (!timeToggled) {
          timeToggled = true;
          this.nextTurn();
        }
      } else {
        timeToggled = false;
      }
    };
    this.turn_timer = d3.timer(callback);
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
    this.prepared = false;
  }

  prepareData(planet_map) {
    if (this.prepared) return;
    this.expeditions.map(exp => {
      exp.origin = planet_map[exp.origin];
      exp.destination = planet_map[exp.destination];
    });

    // Since planet_map is copied from previous turn, we change owner here
    // TODO: Clean up this ugly logic. Turns should make their own map,
    // and then set changed_owner according to transition from previous turn.
    this.planets.map(planet => {
      if (planet.owner != planet_map[planet.name].owner) {
        planet.changed_owner = true;
        planet_map[planet.name].owner = planet.owner;
      } else {
        planet.changed_owner = false;
      }
    });
    this.prepared = true;
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
