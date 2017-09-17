class Visuals {
  constructor() {
    this.scale = 1;
    this.resource_loader = new Visuals.ResourceLoader();
  }

  clearVisuals() {
    svg.selectAll('.planet_wrapper').remove();
    svg.selectAll('.expedition').remove();
  }

  update(turn) {
    var turn = new Visuals.TurnWrapper(turn);
    var planets = turn.planets;
    var expeditions = turn.expeditions;

    // New objects
    var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
    var fleet_wrappers = new_planets.append('g').data(turn.planet_data.map(d => new Visuals.Fleet(d, this.scale)));
    var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');

    // Add the new objects
    Visuals.Planets.addPlanetVisuals(new_planets, turn.color_map, this.scale);
    Visuals.Fleets.addFleetVisuals(fleet_wrappers, turn.color_map);
    Visuals.Expeditions.addExpeditionVisuals(new_expeditions, turn.color_map, this.scale);
  }

  updateAnimations(turn, turn_control) {
    var planets = svg.selectAll('.planet_wrapper').data(turn.planets, d => d.name);
    var expeditions = svg.selectAll('.expedition').data(turn.expeditions, d => d.id);

    //PLANETS
    // Text color
    visuals.attachToAllChildren(planets.selectAll('text')).attr('fill', d => turn.color_map[d.owner]);
    visuals.attachToAllChildren(planets.selectAll('title')).text(d => d.owner);

    visuals.registerTakeOverAnimation(planets, turn.planet_map, turn_control.speed);

    // Update orbits
    planets.select('.orbit').style('stroke', d => turn.color_map[d.owner]);

    // TODO sometimes animation and turn timers get desynched and the animation is interupted
    // also replace this with a for each so we can reuse calculations
    // EXPEDITIONS
    expeditions.transition()
      .duration(turn_control.speed)
      .ease(d3.easeLinear)
      .attr('transform', exp => {
        var point = exp.homannPosition();
        return Visuals.translation(point);
      })
      .attrTween('transform', exp => {
        var turn_diff = turn_control.turn - turn.lastTurn;
        var inter = d3.interpolateNumber(exp.homannAngle(exp.turns_remaining + turn_diff), exp.homannAngle(exp.turns_remaining));
        return t => {
          var point = exp.homannPosition(inter(t));
          return Visuals.translation(point);
        };
      }).on('interrupt', e => console.log("inter"));

    expeditions.select('circle').transition()
      .duration(turn_control.speed)
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

  registerTakeOverAnimation(planets, planet_map, speed) {
    planets.select('.planet')
      .filter(d => d.changed_owner)
      .transition(speed / 2)
      .attr("r", d => planet_map[d.name].size * 1.3)
      .transition(speed / 2)
      .attr("r", d => planet_map[d.name].size);
  }

  attachToAllChildren(d3selector) {
    return d3selector.data((d, i) => {
      return Array(d3selector._groups[i].length).fill(d);
    });
  }

  generatePlanetStyles(planets) {
    planets.map(planet => {
      var types = Config.planet_types;
      var type = types[Math.floor(Math.random() * types.length)];
      var closest = space_math.findClosest(planet, planets) / 2 - Config.orbit_size * 2;
      var size = space_math.clamp(closest, 0.5, Config.max_planet_size);

      planet.type = type;
      planet.size = size;
    });
  }

  static translation(point) {
    return 'translate(' + point.x + ',' + point.y + ')';
  }
}

Visuals.Expeditions = class {
  static addExpeditionVisuals(d3selector, color_map, scale) {
    Visuals.Expeditions.placeExpedition(d3selector);
    Visuals.Expeditions.drawExpedition(d3selector, color_map, scale);
    Visuals.Expeditions.drawShipCount(d3selector, color_map, scale);
  }

  static placeExpedition(d3selector) {
    d3selector.attr('transform', exp => {
      var point = exp.homannPosition();
      return Visuals.translation(point);
    });
  }

  static drawExpedition(d3selector, color_map, scale) {
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
      .attr('r', 1 * scale)
      .style('stroke', exp => color_map[exp.owner])
      .style('stroke-width', 0.05)
      .attr('fill', exp => "url(#ship)")
      .append('title').text(exp => exp.owner);
  }

  static drawShipCount(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('y', 2)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', exp => color_map[exp.owner])
      .text(exp => "\u2694 " + exp.ship_count)
      .append('title').text(exp => exp.owner);
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
      .attr('r', d => d.size)
      .attr('cx', d => d.distance)
      .attr('cy', 0)
      .attr('fill', d => "url(#ship)")
      .append('title').text(d => d.planet.owner);
  }
}

Visuals.Planets = class {
  static addPlanetVisuals(d3selector, color_map, scale) {
    Visuals.Planets.drawPlanet(d3selector);
    Visuals.Planets.drawName(d3selector, color_map, scale);
    Visuals.Planets.drawShipCount(d3selector, color_map, scale);
  }

  static drawPlanet(d3selector) {
    d3selector.append('circle')
      .attr('class', 'planet')
      .attr('r', d => d.size)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => 'url(#' + d.type + ')')
      .append('title')
      .text(d => d.owner);
  }

  static drawName(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 1 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', d => color_map[d.owner])
      .text(d => d.name)
      .append('title')
      .text(d => d.owner);
  }

  static drawShipCount(d3selector, color_map, scale) {
    d3selector.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + d.size + 3 * scale)
      .attr("font-family", "sans-serif")
      .attr("font-size", 1 * scale + "px")
      .attr('fill', d => color_map[d.owner])
      .text(d => "\u2694 " + d.ship_count)
      .append('title').text(d => d.owner);
  }
}

Visuals.Fleet = class {
  constructor(planet, scale) {
    this.size = 1 * scale;
    this.distance = planet.size + Config.orbit_size * scale;
    this.angle = space_math.randomIntBetween(1, 360);
    this.speed = space_math.randomIntBetween(100, 1000);
    this.planet = planet;
  }
}

Visuals.TurnWrapper = class {
  constructor(turn) {
    this.turn = turn;
  }

  get planets() {
    return svg.selectAll('.planet_wrapper').data(this.turn.planets, d => d.name);
  }

  get expeditions() {
    return svg.selectAll('.expedition').data(this.turn.expeditions, d => d.id);
  }

  get planet_data() {
    return this.turn.planets;
  }

  get color_map() {
    return this.turn.color_map;
  }
}

Visuals.ResourceLoader = class {

  constructor() {
    this.rocket_size = 100;
    this.planet_size = 100;
  }

  setupPatterns() {
    // Define patterns
    svg.append("defs");
    Config.planet_types.forEach(p => {
      this.setupPattern(p, this.planet_size, this.planet_size, p);
    });
    this.setupPattern("rocket", this.rocket_size, this.rocket_size, "ship");
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
}