const space_math = new SpaceMath();
const visuals = new Visuals();

class Visualizer {
  
  constructor(){
    this.turn_controller = new TurnController();
  }
  
  generateLegend() {
    // Info
    //TODO do away with the whole legend thing and make planet and fleet owners clear in another way
    // instead create a current state board containing player owned planets and fleet strengths for the more hectic games
    d3.select("body")
      .selectAll("p")
      .data(data.players)
      .enter().append("p")
      .text((d, i) => `I’m called ${d}!`)
      .style('color', (d, i) => color(i));

  }

  readLog(e) {
    var reader = new FileReader();

    reader.onload = event => {
      var turns = this.parseJSON(event.target.result);
      this.turn_controller.init(turns);
      controls.attachEvents(this.turn_controller);
      Visuals.Fleets.animateFleets()
    }

    reader.readAsText(e.files[0]);
  }

  parseJSON(json){
    var turns = json.trim().split('\n');
    return turns.map(turn => {
      return new Turn(JSON.parse(turn));
    });
  }

}

class TurnController {
  constructor(){
    this.speed = Config.base_speed;
    this.turn = 0;
    this.turns = [];
  }

  init(turns) {
    this.turns = turns;
    var first_turn = this.turns[0];
    Visuals.ResourceLoader.setupPatterns();
    first_turn.init();
    first_turn.prepareData();
    visuals.update(first_turn);
  }

  nextTurn() {
    return this.showTurn(this.turn + 1);
  }

  showTurn(newTurn) {
    if (newTurn >= this.turns.length) {
      console.log("end of log");
      return false;
    } else {
      var lastTurn = this.turn;
      this.setTurn(newTurn);
      var turn = this.turns[newTurn];
      turn.lastTurn = lastTurn;
      turn.planet_map = this.turns[0].planet_map;
      turn.color_map = this.turns[0].color_map;
      turn.prepareData();
      visuals.update(turn);
      visuals.updateAnimations(turn, this);
      return true;
    }
  }

  toggleTimer() {
    if (!this.turn_timer || this.turn_timer._time === Infinity) {
      this.startTimer();
      return true;
    } else {
      this.stopTimer();
      return false;
    }
  }

  startTimer() {
    var callback = e => {
      // 20 might seem like a magic number
      // D3 docs say it will at least take 15 ms to draw frame
      if (e % this.speed < 20 && !this.nextTurn()) this.stopTimer();
    };
    this.turn_timer = d3.timer(callback);
  }

  stopTimer() {
    this.turn_timer.stop();
  }

  setTurn(newTurn) {
    this.turn = newTurn;
    d3.select('#turn_slider').property('value', this.turn);
  }

  get maxTurns() {
    return this.turns.length - 1;
  }
}

class Turn {
  constructor(turn){
    this.players = turn.players;

    this.planets = turn.planets.map(planet => {
        return new Planet(planet);
    });

    this.expeditions = turn.expeditions.map(exp => {
      return new Expedition(exp);
    });

    this.planet_map = {};
  }

  init() {
    visuals.clearVisuals();
    visuals.generatePlanetStyles(this.planets);

    // Generate planet_map
    this.planet_map = this.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    visuals.generateViewBox(this.planets);

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = this.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#000";
    this.color_map['None'] = "#d3d3d3";
  }

  prepareData() {
    this.expeditions.map(exp => {
      exp.origin = this.planet_map[exp.origin],
      exp.destination = this.planet_map[exp.destination]
    });

    // Since planet_map is copied from previous turn, we change owner here
    // TODO: Clean up this ugly logic. Turns should make their own map,
    // and then set changed_owner according to transition from previous turn.
    this.planets.map(planet => {
      if (planet.owner != this.planet_map[planet.name].owner) {
        planet.changed_owner = true;
        this.planet_map[planet.name].owner = planet.owner;
      } else {
        planet.changed_owner = false;
      }

      // If the owner doesn't exist link it to the none owner
      // TODO: None might cause collisions
      if (planet.owner === "" || planet.owner === null) planet.owner = "None";

    });
  }

}

class Planet {
  constructor(log_planet){
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

  // TODO: Obsolete?
  relativeCoords() {
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
