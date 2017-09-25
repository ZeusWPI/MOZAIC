const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;

class Helper {
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
    return Helper.translation({
      x: tx,
      y: ty
    }) + ' scale(' + amount + ')';
  }

  static visualOwnerName(name) {
    if (name === null) return 'None';
    else return name;
  }
}

class Expeditions {
  static addExpeditionVisuals(d3selector, color_map, scale) {
    Expeditions.drawExpedition(d3selector, color_map, scale);
    Expeditions.drawShipCount(d3selector, color_map, scale);
  }

  static getLocation(exp) {
    var point = Expeditions.position(exp);
    return Helper.translation(point);
  }

  static getRotation(exp) {
    var angle = Expeditions.angle(exp);
    return Helper.rotate(angle);
  }

  static drawExpedition(d3selector, color_map, scale) {
    d3selector.attr('transform', exp => Expeditions.getLocation(exp));

    d3selector.append('rect')
      .attr('width', 1 * scale)
      .attr('height', 1 * scale)
      .style('stroke', exp => color_map[exp.owner])
      .style('stroke-width', 0.05 * scale)
      .attr('fill', exp => "url(#ship)")
      .attr('transform', exp => Expeditions.getRotation(exp))
      .append('title').text(exp => Helper.visualOwnerName(exp.owner));
  }

  static drawShipCount(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('y', 2 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', exp => color_map[exp.owner])
      .text(exp => "\u2694 " + exp.ship_count)
      .append('title').text(exp => Helper.visualOwnerName(exp.owner));
  }

  static update(d3selector, speed) {
    d3selector.transition()
      .duration(speed)
      .ease(d3.easeLinear)
      .attr('transform', exp => Expeditions.getLocation(exp));

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

  static homannAngle(turn, distance) {
    if (!distance) distance = space_math.euclideanDistance(this.origin, this.destination);
    var mod = turn / distance;
    return mod * (Math.PI * 2) - Math.PI;
  }
}

class Fleets {
  static addFleetVisuals(d3selector, color_map) {
    Fleets.drawOrbit(d3selector, color_map);
    Fleets.drawFleet(d3selector);
  }

  static drawOrbit(d3selector, color_map) {
    d3selector.append('circle')
      .attr('class', 'orbit')
      .attr('transform', d => Helper.translation(d.planet))
      .attr('r', d => d.distance)
      .style('fill', "none")
      .style('stroke', d => {
        return color_map[d.planet.owner];
      })
      .style('stroke-opacity', 0.5)
      .style('stroke-width', 0.05);
  }

  static drawFleet(d3selector, color_map) {
    var wrapper = d3selector.append('g')
      .attr('transform', d => Helper.translation(d.planet));

    wrapper.append('circle')
      .attr('transform', d => Helper.translation(d.planet))
      .attr('class', 'fleet')
      .attr('r', d => d.size * 0.7)
      .attr('cx', d => d.distance)
      .attr('cy', 0)
      .attr('fill', d => "url(#fleet)")
      .append('title').text(d => Helper.visualOwnerName(d.planet.owner));
  }

  static animateFleets(svg, elapsed) {
    svg.selectAll('.fleet')
      .attr('transform', (d, i) => {
        return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
      });
  }
}

class Planets {
  static addPlanetVisuals(d3selector, color_map, scale) {
    Planets.drawPlanet(d3selector, color_map);
    Planets.drawName(d3selector, color_map, scale);
    Planets.drawShipCount(d3selector, color_map, scale);
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
      .text(d => Helper.visualOwnerName(d.owner));
  }

  static update(d3selector, color_map, speed) {
    // Text color
    Helper.attachToAllChildren(d3selector.selectAll('text')).attr('fill', d => color_map[d.owner]);
    Helper.attachToAllChildren(d3selector.selectAll('title')).text(d => Helper.visualOwnerName(d.owner));
    Planets.registerTakeOverAnimation(d3selector, speed);

    // Update attribs
    d3selector.select('.orbit').style('stroke', d => color_map[d.owner]);
    d3selector.select('.planet_background').attr('fill', d => color_map[d.owner]);
    d3selector.select('.planet_model').attr('fill', d => 'url(#' + d.type + ')');
    d3selector.select('.ship_count').text(d => "\u2694 " + d.ship_count).append('title')
      .text(d => Helper.visualOwnerName(d.owner));
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
      .text(d => Helper.visualOwnerName(d.owner));
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
      .text(d => Helper.visualOwnerName(d.owner));
  }

  static registerTakeOverAnimation(planets, speed) {
    planets.select('.planet')
      .filter(d => d.changed_owner)
      .transition(speed / 2)
      .attr('transform', d => Helper.resize(d, 1.3))
      .transition(speed / 2)
      .attr('transform', d => Helper.resize(d, 1));
  }

  static removeOld(d3selector) {
    d3selector.exit().remove();
  }
};

//TODO: since fleet is just a visual thing it is defined here
// when this changes do not forget to move this
class Fleet {
  constructor(planet, scale) {
    this.size = 1 * scale;
    this.distance = planet.size + Config.orbit_size * scale;
    this.angle = space_math.randomIntBetween(1, 360);
    this.speed = space_math.randomIntBetween(100, 1000);
    this.planet = planet;
  }
};

class Scores {
  static addScores(d3selector, color_map, scores) {
    var start_y = 50;
    var size = 30;
    Scores.max_bar_size = 100;

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
        return Scores.max_bar_size * (strength_before / d.total_strength) + '%';
      })
      .attr('y', (d, i) => end_y + 20)
      .attr('width', (d, i) => (Scores.max_bar_size * (d.strengths[i] / d.total_strength)) + '%')
      .attr('height', 20)
      .append('title').text(d => Helper.visualOwnerName(d.player));

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
        return Scores.max_bar_size * (strength_before / d.total_strength) + '%';
      })
      .attr('width', (d, i) => (Scores.max_bar_size * (d.strengths[i] / d.total_strength)) + '%');
  }
};

class ResourceLoader {
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
}

// TODO: this modefies the model, this should perhaps generate a new model that is vis only
class Preprocessor {
  static preprocess(turns) {
    var style_map = Preprocessor.generatePlanetStyles(turns[0], turns[0].planets);

    turns.forEach((turn, i) => {
      turn.planets.forEach(planet => {
        Preprocessor.applyStyle(planet, style_map);
        if (i > 0) {
          turns[i - 1].planets.forEach(p2 => {
            Preprocessor.addTakeoverFlag(p2, planet);
          });
        }
        Preprocessor.addJigglyFlag(planet);
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

module.exports = {
  ResourceLoader,
  Fleets,
  Fleet,
  Scores,
  Preprocessor,
  Planets,
  Expeditions,
  Scores
};
