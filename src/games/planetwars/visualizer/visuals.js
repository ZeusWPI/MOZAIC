const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;

class Visuals {
  constructor() {
    this.scale = 1;
    this.svg = d3.select('#game');
    this.container = this.svg.append('g');
    new Visuals.ResourceLoader(this.svg).setupPatterns();
  }

  animateFleets() {
    Visuals.Fleets.animateFleets(this.svg);
  }

  clearVisuals() {
    this.container.selectAll('.planet_wrapper').remove();
    this.container.selectAll('.expedition').remove();
    d3.select('#score').selectAll('.score').remove();
  }

  generateViewBox(planets) {
    // Setup view
    var min_x = Infinity;
    var min_y = Infinity;
    var max_x = 0;
    var max_y = 0;
    var padding = 5;

    planets.forEach(e => {
      var offset = (e.size + Config.orbit_size + padding);
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

    this.min = [min_x, min_y];
    this.max = [max_x, max_y];

    this.scale = max_x / 50;

    this.svg.attr('viewBox', min_x + ' ' + min_y + ' ' + max_x + ' ' + max_y);
  }

  createZoom() {
    var zoom = d3.zoom()
      .scaleExtent(Config.max_scales)
      .on('zoom', () => {
        var transform = d3.event.transform;
        transform.x = space_math.clamp(transform.x, -this.max[0] / 2, this.max[0] / 2);
        transform.y = space_math.clamp(transform.y, -this.max[1] / 2, this.max[1] / 2);
        this.container.attr('transform', transform);
      });
    this.svg.call(zoom);
  }

  generateWinnerBox(winner, color) {
    var card = d3.select('#end_card');
    card.select('.winner').text(winner).attr('style', 'color: ' + color);
  }

  addNewObjects(raw_turn, color_map) {
    var turn = new Visuals.TurnWrapper(this, raw_turn);
    var planets = turn.planets;
    var expeditions = turn.expeditions;
    var scores = turn.scores;

    // New objects
    var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
    var fleet_wrappers = new_planets.append('g').data(turn.planet_data.map(d => new Visuals.Fleet(d, this.scale)));
    var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');
    var new_scores = scores.enter().append('g').attr('class', 'score');

    // Add the new objects
    Visuals.Planets.addPlanetVisuals(new_planets, color_map, this.scale);
    Visuals.Fleets.addFleetVisuals(fleet_wrappers, color_map);
    Visuals.Expeditions.addExpeditionVisuals(new_expeditions, color_map, this.scale);
    Visuals.Scores.addScores(new_scores, color_map);
  }

  update(turn, turn_control) {
    var turn = new Visuals.TurnWrapper(this, turn);
    var planets = turn.planets;
    var expeditions = turn.expeditions;
    var scores = turn.scores;

    //PLANETS
    Visuals.Planets.update(planets, turn_control);
    Visuals.Planets.removeOld(planets);
    // EXPEDITIONS
    Visuals.Expeditions.update(expeditions, turn_control, turn.planet_map);
    Visuals.Expeditions.removeOld(expeditions);

    Visuals.Scores.update(scores);
  }

  expHomanRotation(exp) {
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
    var t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2));

    var sx = t1 * Math.cos(w) - Math.sin(w);
    var sy = Math.cos(w) + t1 * Math.sin(w);

    var degrees = space_math.toDegrees(Math.atan2(sy, sx));
    return 'rotate(' + (degrees + 180) % 360 + ')';
  }

  static registerTakeOverAnimation(planets, planet_map, speed) {
    planets.select('.planet')
      .filter(d => d.changed_owner)
      .transition(speed / 2)
      .attr('transform', d => Visuals.resize(d, 1.3))
      .transition(speed / 2)
      .attr('transform', d => Visuals.resize(d, 1));
  }

  static attachToAllChildren(d3selector) {
    return d3selector.data((d, i) => {
      return Array(d3selector._groups[i].length).fill(d);
    });
  }

  static translation(point) {
    return 'translate(' + point.x + ',' + point.y + ')';
  }

  static rotate(angle) {
    return 'rotate(' + angle + ')';
  }

  static resize(planet, amount) {
    var tx = -planet.x * (amount - 1);
    var ty = -planet.y * (amount - 1);
    return Visuals.translation({
      x: tx,
      y: ty
    }) + ' scale(' + amount + ')';
  }

  static visualOwnerName(name) {
    if (name === null) return 'None';
    else return name;
  }
}

Visuals.Expeditions = class {
  static addExpeditionVisuals(d3selector, color_map, scale) {
    Visuals.Expeditions.drawExpedition(d3selector, color_map, scale);
    Visuals.Expeditions.drawShipCount(d3selector, color_map, scale);
  }

  static getLocation(exp) {
    var point = Visuals.Expeditions.position(exp);
    return Visuals.translation(point);
  }

  static getRotation(exp) {
    var angle = Visuals.Expeditions.angle(exp);
    return Visuals.rotate(angle);
  }

  static drawExpedition(d3selector, color_map, scale) {
    d3selector.attr('transform', exp => Visuals.Expeditions.getLocation(exp));

    d3selector.append('rect')
      .attr('width', 1 * scale)
      .attr('height', 1 * scale)
      .style('stroke', exp => color_map[exp.owner])
      .style('stroke-width', 0.05 * scale)
      .attr('fill', exp => "url(#ship)")
      .attr('transform', exp => Visuals.Expeditions.getRotation(exp))
      .append('title').text(exp => Visuals.visualOwnerName(exp.owner));
  }

  static drawShipCount(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('y', 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', exp => color_map[exp.owner])
      .text(exp => "\u2694 " + exp.ship_count)
      .append('title').text(exp => Visuals.visualOwnerName(exp.owner));
  }

  static update(d3selector, turn_control) {
    d3selector.transition()
      .duration(turn_control.speed_binder.value)
      .ease(d3.easeLinear)
      .attr('transform', exp => Visuals.Expeditions.getLocation(exp));

  }
  static removeOld(d3selector) {
    d3selector.exit().remove();
  }

  static position(expedition) {
    var total_distance = Math.ceil(space_math.euclideanDistance(expedition.origin, expedition.destination));
    var mod = expedition.turns_remaining / total_distance;

    var new_x = expedition.origin.x - expedition.destination.x;
    new_x *= mod;
    new_x += expedition.destination.x;

    var new_y = expedition.origin.y - expedition.destination.y;
    new_y *= mod;
    new_y += expedition.destination.y;

    return {
      'x': new_x,
      'y': new_y
    };
  }

  static homannPosition(angle) {
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

  static angle(expedition) {
    return (Math.atan2(expedition.destination.y - expedition.origin.y, expedition.destination.x - expedition.origin.x) * (180 / Math.PI) + 45) % 360;
  }

  static homannAngle(turn, distance) {
    if (!distance) distance = space_math.euclideanDistance(this.origin, this.destination);
    var mod = turn / distance;
    return mod * (Math.PI * 2) - Math.PI;
  }
}

Visuals.Fleets = class {
  static addFleetVisuals(d3selector, color_map) {
    Visuals.Fleets.drawOrbit(d3selector, color_map);
    var wrapper = Visuals.Fleets.placeFleet(d3selector);
    Visuals.Fleets.drawFleet(wrapper);
  }

  static drawOrbit(d3selector, color_map) {
    d3selector.append('circle')
      .attr('class', 'orbit')
      .attr('transform', d => Visuals.translation(d.planet))
      .attr('r', d => d.distance)
      .style('fill', "none")
      .style('stroke', d => {
        return color_map[d.planet.owner];
      })
      .style('stroke-opacity', 0.5)
      .style('stroke-width', 0.05);
  }

  static placeFleet(d3selector) {
    return d3selector.append('g')
      .attr('transform', d => Visuals.translation(d.planet));
  }

  static drawFleet(wrapper, color_map) {
    wrapper.append('circle')
      .attr('transform', d => Visuals.translation(d.planet))
      .attr('class', 'fleet')
      .attr('r', d => d.size * 0.7)
      .attr('cx', d => d.distance)
      .attr('cy', 0)
      .attr('fill', d => "url(#fleet)")
      .append('title').text(d => Visuals.visualOwnerName(d.planet.owner));
  }

  static animateFleets(svg) {
    d3.timer(elapsed => {
      svg.selectAll('.fleet')
        .attr('transform', (d, i) => {
          return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
        });
    });
  }
};

Visuals.Planets = class {
  static addPlanetVisuals(d3selector, color_map, scale) {
    Visuals.Planets.drawPlanet(d3selector, color_map);
    Visuals.Planets.drawName(d3selector, color_map, scale);
    Visuals.Planets.drawShipCount(d3selector, color_map, scale);
  }

  static drawPlanet(d3selector, color_map) {
    var wrapper = d3selector.append('g')
      .attr('class', 'planet');

    wrapper.append('circle')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('class', 'planet_background')
      .attr('fill', d => color_map[d.owner]);

    wrapper.append('circle')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('class', 'planet_model')
      .attr('fill', d => 'url(#' + d.type + ')');

    wrapper.append('title')
      .text(d => Visuals.visualOwnerName(d.owner));
  }

  static update(d3selector, turn_control, planet_map) {
    // Text color
    Visuals.attachToAllChildren(d3selector.selectAll('text')).attr('fill', d => turn_control.color_map[d.owner]);
    Visuals.attachToAllChildren(d3selector.selectAll('title')).text(d => Visuals.visualOwnerName(d.owner));
    Visuals.registerTakeOverAnimation(d3selector, planet_map, turn_control.speed_binder.value);

    // Update attribs
    d3selector.select('.orbit').style('stroke', d => turn_control.color_map[d.owner]);
    d3selector.select('.planet_background').attr('fill', d => turn_control.color_map[d.owner]);
    d3selector.select('.planet_model').attr('fill', d => 'url(#' + d.type + ')');
    d3selector.select('.ship_count').text(d => "\u2694 " + d.ship_count).append('title')
      .text(d => Visuals.visualOwnerName(d.owner));
  }

  static drawName(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', d => color_map[d.owner])
      .text(d => d.name)
      .append('title')
      .text(d => Visuals.visualOwnerName(d.owner));
  }

  static drawShipCount(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 3.5 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', d => color_map[d.owner])
      .attr('class', 'ship_count')
      .text(d => "\u2694 " + d.ship_count)
      .append('title')
      .text(d => Visuals.visualOwnerName(d.owner));
  }

  static removeOld(d3selector) {
    d3selector.exit().remove();
  }
};

Visuals.Fleet = class {
  constructor(planet, scale) {
    this.size = 1 * scale;
    this.distance = planet.size + Config.orbit_size * scale;
    this.angle = space_math.randomIntBetween(1, 360);
    this.speed = space_math.randomIntBetween(100, 1000);
    this.planet = planet;
  }
};


// TODO: clean up
Visuals.TurnWrapper = class {
  constructor(visuals, turn) {
    this.visuals = visuals;
    this.turn = turn;
  }

  get planets() {
    return this.visuals.container
      .selectAll('.planet_wrapper')
      .data(this.turn.planets, d => d.name);
  }

  get expeditions() {
    return this.visuals.
    container.selectAll('.expedition').data(this.turn.expeditions, d => d.id);
  }

  get planet_data() {
    return this.turn.planets;
  }

  get color_map() {
    return this.turn.color_map;
  }

  get scores() {
    return d3.select('#score').selectAll('.score').data(this.turn.scores, d => d.player);
  }
};

Visuals.Scores = class {
  static addScores(d3selector, color_map, scores) {
    var start_y = 50;
    var size = 30;
    Visuals.Scores.max_bar_size = 100;

    d3selector.attr("font-family", "sans-serif")
      .attr("font-size", 14 + "px")
      .attr('fill', d => color_map[d.player]);
    d3selector.append('circle')
      .attr('r', d => 5)
      .attr('cx', d => "5%")
      .attr('cy', (d, i) => start_y + size * i);
    d3selector.append('text')
      .attr('class', 'player_name')
      .attr('x', d => "15%")
      .attr('y', (d, i) => start_y + 5 + size * i)
      .text(d => d.player);
    d3selector.append('text')
      .attr('class', 'planet_count')
      .attr('x', d => "45%")
      .attr('y', (d, i) => start_y + 5 + size * i)
      .text(d => d.planets);
    d3selector.append('circle')
      .attr('r', d => "3%")
      .attr('cx', d => "55%")
      .attr('cy', (d, i) => start_y - 1 + size * i)
      .attr('fill', 'url(#earth)')
      .attr('stroke', d => color_map[d.player]);
    var end_y = 0;
    d3selector.append('text').attr('class', 'strength')
      .attr('x', d => "80%")
      .attr('y', (d, i) => {
        end_y = start_y + 5 + size * i;
        return end_y;
      })
      .text((d, i) => d.strengths[i] + " \u2694");
    end_y += 20;

    d3selector.append('rect').attr('class', 'ratioblock')
      .attr('x', (d, i) => {
        var strength_before = 0;
        if (i != 0) {
          for (var j = 0; j < i; j++) {
            strength_before += d.strengths[j];
          }
        }
        return Visuals.Scores.max_bar_size * (strength_before / d.total_strength) + '%';
      })
      .attr('y', (d, i) => end_y + 20)
      .attr('width', (d, i) => (Visuals.Scores.max_bar_size * (d.strengths[i] / d.total_strength)) + '%')
      .attr('height', 20)
      .append('title').text(d => Visuals.visualOwnerName(d.player));

  }

  static update(d3selector) {
    d3selector.select('.planet_count').text(d => d.planets);
    d3selector.select('.strength').text((d, i) => d.strengths[i] + " \u2694");
    d3selector.select('.ratioblock').attr('x', (d, i) => {
        var strength_before = 0;
        if (i != 0) {
          for (var j = 0; j < i; j++) {
            strength_before += d.strengths[j];
          }
        }
        return Visuals.Scores.max_bar_size * (strength_before / d.total_strength) + '%';
      })
      .attr('width', (d, i) => (Visuals.Scores.max_bar_size * (d.strengths[i] / d.total_strength)) + '%');
  }
};

Visuals.ResourceLoader = class {
  constructor(svg) {
    this.svg = svg;
  }

  setupPatterns() {
    // Define patterns
    this.svg.append("defs");
    Config.planet_types.forEach(p => {
      this.setupPattern(p + ".svg", 100, 100, p);
    });
    this.setupPattern("rocket.svg", 100, 100, "ship");
    this.setupPattern("station.svg", 100, 100, "fleet");
    this.setupPattern("jigglypoef.svg", 100, 100, "jigglyplanet");
  }

  setupPattern(name, width, height, id) {
    this.svg.select("defs")
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
      .attr("xlink:href", "res/" + name);
  }
};

Visuals.Preprocessing = class {
  static addPlanetCues(turns) {
    var style_map = Visuals.Preprocessing.generatePlanetStyles(turns[0], turns[0].planets);

    turns.forEach((turn, i) => {
      turn.planets.forEach(planet => {
        Visuals.Preprocessing.applyStyle(planet, style_map);
        if (i > 0) {
          turns[i - 1].planets.forEach(p2 => {
            Visuals.Preprocessing.addTakeoverFlag(p2, planet);
          });
        }
        Visuals.Preprocessing.addJigglyFlag(planet);
      });
    });
  }

  static generatePlanetStyles(turn, planets) {
    return turn.planets.reduce((map, planet) => {
      var types = Config.planet_types;
      var type = types[Math.floor(Math.random() * types.length)];
      var closest = space_math.findClosest(planet, planets) / 2 - Config.orbit_size * 2;
      var size = space_math.clamp(closest, 0.5, Config.max_planet_size);
      planet.type = type;
      planet.size = size;
      map[planet.name] = planet;
      return map;
    }, {});
  }
  static applyStyle(planet, map) {
    var template = map[planet.name];
    planet.type = template.type;
    planet.size = template.size;
  }

  static addTakeoverFlag(last_turn_planet, planet) {
    if (planet.name === last_turn_planet.name && planet.owner !== last_turn_planet.owner) {
      planet.changed_owner = true;
    }
  }

  static addJigglyFlag(planet) {
    if (['jigglypoef', 'iepoef', 'iepoev', 'jigglypuff', 'jigglypoev'].includes(planet.owner)) {
      planet.type = 'jigglyplanet';
    }
  }
}

module.exports = Visuals;
