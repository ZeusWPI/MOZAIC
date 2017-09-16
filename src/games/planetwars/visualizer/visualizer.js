// TODO: Throw all d3 visual and svg manipulation in a separate class

// Constants
const svg = d3.select("svg");

const planet_types = ["water", "red", "moon", "mars", "earth"];

const max_planet_size = 3;
const orbit_size = 2;

// Globals
const base_speed = 1000;
const space_math = new SpaceMath();

class Visualizer {

  constructor(){
    this.turn_controller = new TurnController();
    this.scale = 1;
  }

  setupPatterns() {
    // Define patterns
    svg.append("defs");
    planet_types.forEach(p => {
      this.setupPattern(p, 100, 100, p);
    });
    this.setupPattern("rocket", 100, 100, "ship");
  }

  setupPattern(name, width, height, id) {
    svg.select("defs")
      .append("pattern")
      .attr("id", id)
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("preserveAspectRation", "none")
      .attr("width", 1)
      .attr("height", 1)
      .append("image")
      .attr("width", width)
      .attr("height", height)
      .attr("preserveAspectRation", "none")
      .attr("xlink:href", "res/" + name + ".png");
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
      this.animateFleets()
    }

    reader.readAsText(e.files[0]);
  }

  parseJSON(json){
    var turns = json.trim().split('\n');
    return turns.map(turn => {
      return new Turn(JSON.parse(turn));
    });
  }

  animateFleets(){
    d3.timer(elapsed => {
      svg.selectAll('.fleet')
        .attr('transform', (d, i) => {
          return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
        });
    });
  }
}

class TurnController {
  constructor(){
    this.speed = base_speed;
    this.turn = 0;
    this.turns = [];
  }

  init(turns) {
    this.turns = turns;
    var first_turn = this.turns[0];
    first_turn.init();
    first_turn.prepareData();
    first_turn.update(this);
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
      turn.update();
      Visuals.updateAnimations(this, turn);
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

class Visuals {
  static addPlanets(d3selector, color_map) {
    d3selector.append('circle')
      .attr('class', 'planet')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => 'url(#' + d.type + ')')
      .append('title')
      .text(d => d.owner);

    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 1)
      .attr("font-family", "sans-serif")
      .attr("font-size", "1px")
      .attr('fill', d => color_map[d.owner])
      .text(d => d.name)
      .append('title')
      .text(d => d.owner);

    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 3)
      .attr("font-family", "sans-serif")
      .attr("font-size", "1px")
      .attr('fill', d => color_map[d.owner])
      .text(d => "\u2694 " + d.ship_count)
      .append('title').text(d => d.owner);
  }

  static addFleets(d3selector, color_map) {
    d3selector.append('circle')
      .attr('class', 'orbit')
      .attr('transform', d => Visuals.translation(d.planet))
      .attr('r', d => d.distance)
      .style('fill', "none")
      .style('stroke', d => {

        return color_map[d.planet.owner];

      })
      .style('stroke-width', 0.05);

    var wrapper = d3selector.append('g')
      .attr('transform', d => Visuals.translation(d.planet));

    wrapper.append('circle')
      .attr('transform', d => Visuals.translation(d.planet))
      .attr('class', 'fleet')
      .attr('r', d => d.size)
      .attr('cx', d => d.distance)
      .attr('cy', 0)
      .attr('fill', d => "url(#ship)")
      .append('title').text(d => d.planet.owner);
  }

  static addExpeditions(d3selector, color_map) {
    d3selector.attr('transform', exp => {
      var point = exp.homannPosition();
      return Visuals.translation(point);
    });

    d3selector.append('circle')
      .attr('transform', exp => {
        var total_distance = space_math.euclideanDistance(exp.origin, exp.destination);

        var r1 = (exp.origin.size) / 2 + 3;
        var r2 = (exp.destination.size) / 2 + 3;

        var a = (total_distance + r1 + r2) / 2;
        var c = a - r1 / 2 - r2 / 2;
        var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

        var dx = exp.origin.x - exp.destination.x;
        var dy = exp.origin.y - exp.destination.y;
        var scaler = a / b;

        // elipse rotation angle
        var w = Math.atan2(dy / scaler, dx);
        // angle form center
        var angle = exp.homannAngle(exp.turns_remaining);

        // unrotated elipse point
        var dx = a * Math.cos(angle);
        var dy = b * Math.sin(angle);

        // unrotated slope
        var t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2))

        var sx = t1 * Math.cos(w) - Math.sin(w);
        var sy = Math.cos(w) + t1 * Math.sin(w);

        var degrees = space_math.toDegrees(Math.atan2(sy, sx));
        return 'rotate(' + (degrees + 180) % 360 + ')';
      })
      .attr('r', 1)
      .style('stroke', exp => color_map[exp.owner])
      .style('stroke-width', 0.05)
      .attr('fill', exp => "url(#ship)")
      .append('title').text(exp => exp.owner);

    d3selector.append('text')
      .attr('y', 2)
      .attr("font-family", "sans-serif")
      .attr("font-size", "1px")
      .attr('fill', exp => color_map[exp.owner])
      .text(exp => "\u2694 " + exp.ship_count)
      .append('title').text(exp => exp.owner);
  }

  static updateAnimations(visualizer, turn) {
    var planets = svg.selectAll('.planet_wrapper').data(turn.planets, d => d.name);
    var expeditions = svg.selectAll('.expedition')
      .data(turn.expeditions, d => {
        return d.id;
      });

    //PLANETS
    // Text color
    Visuals.attachToAllChildren(planets.selectAll('text')).attr('fill', d => turn.color_map[d.owner]);
    Visuals.attachToAllChildren(planets.selectAll('title')).text(d => d.owner);

    Visuals.registerTakeOverAnimation(planets, turn.planet_map);

    // Update orbits
    planets.select('.orbit').style('stroke', d => turn.color_map[d.owner]);

    // TODO sometimes animation and turn timers get desynched and the animation is interupted
    // also replace this with a for each so we can reuse calculations
    // EXPEDITIONS
    expeditions.transition()
      .duration(visualizer.speed)
      .ease(d3.easeLinear)
      .attr('transform', exp => {
        var point = exp.homannPosition();
        return Visuals.translation(point);
      })
      .attrTween('transform', exp => {
        var turn_diff = visualizer.turn - turn.lastTurn;
        var inter = d3.interpolateNumber(exp.homannAngle(exp.turns_remaining + turn_diff), exp.homannAngle(exp.turns_remaining));
        return t => {
          var point = exp.homannPosition(inter(t));
          return Visuals.translation(point);
        };
      }).on('interrupt', e => console.log("inter"));

    expeditions.select('circle').transition()
      .duration(visualizer.speed)
      .ease(d3.easeLinear)
      .attr('transform', exp => {
        var total_distance = space_math.euclideanDistance(exp.origin, exp.destination);

        var r1 = (exp.origin.size) / 2 + 3;
        var r2 = (exp.destination.size) / 2 + 3;

        var a = (total_distance + r1 + r2) / 2;
        var c = a - r1 / 2 - r2 / 2;
        var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

        var dx = exp.origin.x - exp.destination.x;
        var dy = exp.origin.y - exp.destination.y;
        var scaler = a / b;

        // elipse rotation angle
        var w = Math.atan2(dy / scaler, dx);
        // angle form center
        var angle = exp.homannAngle(exp.turns_remaining);

        // unrotated elipse point
        var dx = a * Math.cos(angle);
        var dy = b * Math.sin(angle);

        // unrotated slope
        var t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2))

        var sx = t1 * Math.cos(w) - Math.sin(w);
        var sy = Math.cos(w) + t1 * Math.sin(w);

        var degrees = space_math.toDegrees(Math.atan2(sy, sx));
        return 'rotate(' + (degrees + 180) % 360 + ')';
      })

    // Old expeditions to remove
    expeditions.exit().remove();
    planets.exit().remove();
  }

  static registerTakeOverAnimation(planets, planet_map) {
    planets.select('.planet')
      .filter(d => d.changed_owner)
      .transition(visualizer.speed / 2)
      .attr("r", d => planet_map[d.name].size * 1.3)
      .transition(visualizer.speed / 2)
      .attr("r", d => planet_map[d.name].size);
  }

  static attachToAllChildren(d3selector) {
    return d3selector.data((d, i) => {
      return Array(d3selector._groups[i].length).fill(d);
    });
  }

  static translation(point) {
    return 'translate(' + point.x + ',' + point.y + ')';
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
    this.planets.map((planet) => {
      planet.type = planet_types[Math.floor(Math.random() * planet_types.length)];
      planet.size = space_math.randomBetween(1, max_planet_size);
    });

    this.planet_map = this.planets.reduce((map, planet) => {
      map[planet.name] = planet;
      return map;
    }, {});

    // Setup view
    var min_x = Infinity;
    var min_y = Infinity;
    var max_x = 0;
    var max_y = 0;
    var padding = 1;

    this.planets.forEach(e => {
      if (e.x > max_x) {
        max_x = e.x + (e.size + 2 + padding);
      }
      if (e.x < min_x) {
        min_x = e.x - (e.size + 2 + padding);
      }
      if (e.y > max_y) {
        max_y = e.y + (e.size + 2 + padding);
      }
      if (e.y < min_y) {
        min_y = e.y - (e.size + 2 + padding);
      }
    });

    svg.attr('width', '100%')
      .attr('height', window.innerHeight)
      .attr('viewBox', min_x + ' ' + min_y + ' ' + max_x + ' ' + max_y);

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    this.color_map = this.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    this.color_map[null] = "#000";
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
    });
  }

  update() {
    var planets = svg.selectAll('.planet_wrapper').data(this.planets, d => d.name);
    var expeditions = svg.selectAll('.expedition')
      .data(this.expeditions, d => {
        return d.id;
      });

    // New objects
    var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
    var fleet_wrapper = new_planets.append('g')
      .data(this.planets.map(d => {
        return {
          size: 1,
          distance: d.size + orbit_size,
          angle: space_math.randomIntBetween(1, 360),
          speed: space_math.randomIntBetween(100, 1000),
          planet: d
        };
      }));
    var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');

    // Add the new objects
    Visuals.addPlanets(new_planets, this.color_map);
    Visuals.addFleets(fleet_wrapper, this.color_map);
    Visuals.addExpeditions(new_expeditions, this.color_map);
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
