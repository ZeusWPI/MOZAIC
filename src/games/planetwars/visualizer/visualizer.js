// Constants
const svg = d3.select("svg");

const planet_types = ["water", "red", "moon", "mars", "earth"];

const max_planet_size = 3;
const orbit_size = 2;

// Globals
const base_speed = 1000;
const space_math = new SpaceMath();

class Visualizer {

  constructor() {
    this.speed = base_speed;
    this.turn = 0;
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

  init(data) {
    // Clear data
    var planets = svg.selectAll('.planet_wrapper').remove();
    var expeditions = svg.selectAll('.expedition').remove();
    // Calculate scale


    // Planet map
    data.planet_map = data.planets.reduce((map, o) => {
      o.type = planet_types[Math.floor(Math.random() * planet_types.length)];
      var closest = space_math.findClosest(o, data.planets) / 2 - orbit_size * 2;
      o.size = space_math.clamp(closest, 0, max_planet_size);
      map[o.name] = o;
      return map;
    }, {});

    // Setup view
    var min_x = Infinity;
    var min_y = Infinity;
    var max_x = 0;
    var max_y = 0;
    var padding = 1;

    data.planets.forEach(e => {
      var offset = (e.size + orbit_size + padding);
      var n_max_x = e.x + offset;
      var n_min_x = e.x - offset;
      var n_max_y = e.y + offset;
      var n_min_y = e.y - offset;

      if (n_max_x > max_x) {
        max_x = n_max_x;
      }
      if (n_min_x < min_x) {
        min_x = n_min_x;
      }
      if (n_max_y > max_y) {
        max_y = n_max_y;
      }
      if (n_min_y < min_y) {
        min_y = n_min_y;
      }
    });

    max_x += Math.abs(min_x);
    max_y += Math.abs(min_y);

    //this.scale = max_x / 50;
    //console.log(this.scale);

    svg.attr('viewBox', min_x + ' ' + min_y + ' ' + max_x + ' ' + max_y);

    // Color map
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    data.color_map = data.players.reduce((map, o, i) => {
      map[o] = color(i);
      return map;
    }, {});
    //Adds none owner to color pool
    data.color_map['None'] = "#000";
  }

  prepareData(data) {
    data.expeditions = data.expeditions.map(e => {
      return new Expedition(
        e.id,
        data.planet_map[e.origin],
        data.planet_map[e.destination],
        e.ship_count,
        e.owner,
        e.turns_remaining
      )
    });

    data.planets.map(e => {
      if (e.owner != data.planet_map[e.name].owner) {
        e.changed_owner = true;
        data.planet_map[e.name].owner = e.owner;
      } else {
        e.changed_owner = false;
      }
      // If the owner doesn't exist link it to the none owner
      if (e.owner === "" || e.owner === null) e.owner = "None";

    });
  }

  generateLegend(data) {
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

  addPlanets(d3selector, data) {
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
      .attr('y', d => d.y + d.size + 1 * this.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * this.scale + "px")
      .attr('fill', d => data.color_map[d.owner])
      .text(d => d.name)
      .append('title')
      .text(d => d.owner);

    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 3 * this.scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * this.scale + "px")
      .attr('fill', d => data.color_map[d.owner])
      .text(d => "\u2694 " + d.ship_count)
      .append('title').text(d => d.owner);
  }

  addFleets(d3selector, data) {
    d3selector.append('circle')
      .attr('class', 'orbit')
      .attr('transform', d => this.translation(d.planet))
      .attr('r', d => d.distance)
      .style('fill', "none")
      .style('stroke', d => {
        return data.color_map[d.planet.owner];
      })
      .style('stroke-width', 0.05 * this.scale);

    var wrapper = d3selector.append('g')
      .attr('transform', d => this.translation(d.planet));

    wrapper.append('circle')
      .attr('transform', d => this.translation(d.planet))
      .attr('class', 'fleet')
      .attr('r', d => d.size)
      .attr('cx', d => d.distance)
      .attr('cy', 0)
      .attr('fill', d => "url(#ship)")
      .append('title').text(d => d.planet.owner);

  }

  addExpeditions(d3selector, data) {
    d3selector.attr('transform', exp => {
      var point = exp.homannPosition();
      return this.translation(point);
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
      .attr('r', 1 * this.scale)
      .style('stroke', exp => data.color_map[exp.owner])
      .style('stroke-width', 0.05)
      .attr('fill', exp => "url(#ship)")
      .append('title').text(exp => exp.owner);

    d3selector.append('text')
      .attr('y', 2)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * this.scale + "px")
      .attr('fill', exp => data.color_map[exp.owner])
      .text(exp => "\u2694 " + exp.ship_count)
      .append('title').text(exp => exp.owner);
  }

  update(data) {
    var planets = svg.selectAll('.planet_wrapper').data(data.planets, d => d.name);
    var expeditions = svg.selectAll('.expedition')
      .data(data.expeditions, d => {
        return d.id;
      });

    // New objects
    var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
    var fleet_wrapper = new_planets.append('g')
      .data(data.planets.map(d => {
        return {
          size: 1 * this.scale,
          distance: d.size + orbit_size * this.scale,
          angle: space_math.randomIntBetween(1, 360),
          speed: space_math.randomIntBetween(100, 1000),
          planet: d
        };
      }));
    var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');

    // Add the new objects
    this.addPlanets(new_planets, data);
    this.addFleets(fleet_wrapper, data);
    this.addExpeditions(new_expeditions, data);
  }

  updateAnimations(data) {
    var planets = svg.selectAll('.planet_wrapper').data(data.planets, d => d.name);
    var expeditions = svg.selectAll('.expedition')
      .data(data.expeditions, d => {
        return d.id;
      });

    //PLANETS
    // Text color
    this.attachToAllChildren(planets.selectAll('text')).attr('fill', d => data.color_map[d.owner]);
    this.attachToAllChildren(planets.selectAll('title')).text(d => d.owner);

    //Takeover transition
    planets.select('.planet')
      .filter(d => d.changed_owner)
      .transition(this.speed / 2)
      .attr("r", d => data.planet_map[d.name].size * 1.3)
      .transition(this.speed / 2)
      .attr("r", d => data.planet_map[d.name].size);

    // Update orbits
    planets.select('.orbit').style('stroke', d => data.color_map[d.owner]);

    // TODO sometimes animation and turn timers get desynched and the animation is interupted
    // also replace this with a for each so we can reuse calculations
    // EXPEDITIONS
    expeditions.transition()
      .duration(this.speed)
      .ease(d3.easeLinear)
      .attr('transform', exp => {
        var point = exp.homannPosition();
        return this.translation(point);
      })
      .attrTween('transform', exp => {
        var turn_diff = this.turn - data.lastTurn;
        var inter = d3.interpolateNumber(exp.homannAngle(exp.turns_remaining + turn_diff), exp.homannAngle(exp.turns_remaining));
        return t => {
          var point = exp.homannPosition(inter(t));
          return this.translation(point);
        };
      }).on('interrupt', e => console.log("inter"));

    expeditions.select('circle').transition()
      .duration(this.speed)
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

  parseJson(e) {
    var reader = new FileReader();
    reader.onload = event => {

      var text = event.target.result;
      var turns = text.trim().split('\n');
      this.turns = turns.map(turn => {
        return JSON.parse(turn)
      });

      var data = this.turns[0];
      this.setupPatterns();
      this.init(data);
      this.prepareData(data);
      this.update(data);

      controls.attachEvents(this);

      // Fleet animation timer
      d3.timer(elapsed => {
        svg.selectAll('.fleet')
          .attr('transform', (d, i) => {
            return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
          });
      });
    }

    reader.readAsText(e.files[0]);

  }

  nextTurn() {
    return this.showTurn(parseInt(this.turn) + 1);
  }

  // TODO: Fix
  previousTurn() {
    return this.showTurn(this.turn - 1);
  }

  showTurn(newTurn) {
    if (newTurn >= this.turns.length) {
      console.log("end of log");
      return false;
    } else {
      var lastTurn = this.turn;
      this.setTurn(newTurn);
      var data = this.turns[newTurn];
      data.lastTurn = lastTurn;
      data.planet_map = this.turns[0].planet_map;
      data.color_map = this.turns[0].color_map;
      this.prepareData(data);
      this.update(data);
      this.updateAnimations(data);
      return true;
    }
  }

  translation(point) {
    return 'translate(' + point.x + ',' + point.y + ')';
  }

  //Timer functions

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

  attachToAllChildren(d3selector) {
    return d3selector.data((d, i) => {
      return Array(d3selector._groups[i].length).fill(d);
    });
  }

  setTurn(newTurn) {
    this.turn = newTurn;
    d3.select('#turn_slider').property('value', this.turn);
  }

  get maxTurns() {
    return this.turns.length - 1;
  }
}

class Expedition {
  constructor(id, origin, destination, ship_count, owner, turns_remaining) {
    this.id = id;
    this.origin = origin;
    this.destination = destination;
    this.ship_count = ship_count;
    this.owner = owner;
    this.turns_remaining = turns_remaining;
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
