// Constants

const svg = d3.select("svg");

const planet_types = ["water", "red", "moon", "mars", "earth"];

const max_planet_size = 3;
const orbit_size = 2;

// Globals
var base_speed = 1000;
// current speed
var speed = base_speed;

// D3 timer that controls turns
var turn_timer;

//current turn
var turn = 0;

// Parsed input json
var parsed;

function setupPatterns(svg) {
  // Define patterns
  svg.append("defs");
  planet_types.forEach(p => {
    setupPattern(p, 100, 100, p);
  });
  setupPattern("rocket", 100, 100, "ship");
}

function setupPattern(name, width, height, id) {
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

function init(data) {

  // Planet map
  data.planet_map = data.planets.reduce((map, o) => {
    o.type = planet_types[Math.floor(Math.random() * planet_types.length)];
    o.size = randomBetween(1, max_planet_size);
    //o.size = 2;
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
  data.color_map = data.players.reduce((map, o, i) => {
    map[o] = color(i);
    return map;
  }, {});
}

function prepareData(data) {
  data.expeditions.map(e => {
    e.origin_object = data.planet_map[e.origin];
    e.destination_object = data.planet_map[e.destination];
  });

  data.planets.map(e => {
    if (e.owner != data.planet_map[e.name].owner) {
      e.changed_owner = true;
      data.planet_map[e.name].owner = e.owner;

    }
  });
}

function generateLegend(data) {
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

function addPlanets(d3selector, data) {
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
    .attr('fill', d => data.color_map[d.owner])
    .text(d => d.name)
    .append('title')
    .text(d => d.owner);

  d3selector.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 3)
    .attr("font-family", "sans-serif")
    .attr("font-size", "1px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);
}

function addFleets(d3selector, data) {
  d3selector.append('circle')
    .attr('class', 'orbit')
    .attr('transform', d => translation(d.planet))
    .attr('r', d => d.distance)
    .style('fill', "none")
    .style('stroke', d => data.color_map[d.planet.owner])
    .style('stroke-width', 0.05);

  var wrapper = d3selector.append('g')
    .attr('transform', d => translation(d.planet));

  wrapper.append('circle')
    .attr('transform', d => translation(d.planet))
    .attr('class', 'fleet')
    .attr('r', d => d.size)
    .attr('cx', d => d.distance)
    .attr('cy', 0)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.planet.owner);

}

function addExpeditions(d3selector, data) {
  d3selector.attr('transform', d => {
    var point = homannPosition(d);
    return translation(point);
  });

  d3selector.append('circle')
    .attr('transform', d => {
      var total_distance = euclideanDistance(d.origin_object, d.destination_object);

      var r1 = (d.origin_object.size) / 2 + 3;
      var r2 = (d.destination_object.size) / 2 + 3;

      var a = (total_distance + r1 + r2) / 2;
      var c = a - r1 / 2 - r2 / 2;
      var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

      var dx = d.origin_object.x - d.destination_object.x;
      var dy = d.origin_object.y - d.destination_object.y;
      var scaler = a / b;

      // elipse rotation angle
      var w = Math.atan2(dy / scaler, dx);
      // angle form center
      var angle = homannAngle(d, d.turns_remaining);


      // unrotated elipse point
      var dx = a * Math.cos(angle);
      var dy = b * Math.sin(angle);

      // unrotated slope
      var t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2))

      var sx = t1 * Math.cos(w) - Math.sin(w);
      var sy = Math.cos(w) + t1 * Math.sin(w);

      var degrees = toDegrees(Math.atan2(sy, sx));
      return 'rotate(' + (degrees + 180) % 360 + ')';
    })
    .attr('r', 1)
    .style('stroke', d => data.color_map[d.owner])
    .style('stroke-width', 0.05)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.owner);

  d3selector.append('text')
    .attr('y', 2)
    .attr("font-family", "sans-serif")
    .attr("font-size", "1px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);
}

function update(data) {
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
        size: 1,
        distance: d.size + orbit_size,
        angle: randomIntBetween(1, 360),
        speed: randomIntBetween(100, 1000),
        planet: d
      };
    }));
  var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');

  // Add the new objects
  addPlanets(new_planets, data);
  addFleets(fleet_wrapper, data);
  addExpeditions(new_expeditions, data);
}

function updateAnimations(data) {
  var planets = svg.selectAll('.planet_wrapper').data(data.planets, d => d.name);
  var expeditions = svg.selectAll('.expedition')
    .data(data.expeditions, d => {
      return d.id;
    });

  //PLANETS
  // Text color
  attachToAllChildren(planets.selectAll('text')).attr('fill', d => data.color_map[d.owner]);
  attachToAllChildren(planets.selectAll('title')).text(d => d.owner);

  //Takeover transition
  planets.select('.planet')
    .filter(d => d.changed_owner)
    .transition(speed / 2)
    .attr("r", d => data.planet_map[d.name].size * 1.3)
    .transition(speed / 2)
    .attr("r", d => data.planet_map[d.name].size);

  // Update orbits
  planets.select('.orbit').style('stroke', d => data.color_map[d.owner]);

  // TODO sometimes animation and turn timers get desynched and the animation is interupted
  // also replace this with a for each so we can reuse calculations
  // EXPEDITIONS
  expeditions.transition()
    .duration(speed)
    .ease(d3.easeLinear)
    .attr('transform', d => {
      var point = homannPosition(d);
      return translation(point);
    })
    .attrTween('transform', d => {
      var turn_diff = turn - data.lastTurn;
      var inter = d3.interpolateNumber(homannAngle(d, d.turns_remaining + turn_diff), homannAngle(d, d.turns_remaining));
      return t => {
        var point = homannPosition(d, inter(t));
        return translation(point);
      };
    }).on('interrupt', e => console.log("inter"));

  expeditions.select('circle').transition()
    .duration(speed)
    .ease(d3.easeLinear)
    .attr('transform', d => {
      var total_distance = euclideanDistance(d.origin_object, d.destination_object);

      var r1 = (d.origin_object.size) / 2 + 3;
      var r2 = (d.destination_object.size) / 2 + 3;

      var a = (total_distance + r1 + r2) / 2;
      var c = a - r1 / 2 - r2 / 2;
      var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

      var dx = d.origin_object.x - d.destination_object.x;
      var dy = d.origin_object.y - d.destination_object.y;
      var scaler = a / b;

      // elipse rotation angle
      var w = Math.atan2(dy / scaler, dx);
      // angle form center
      var angle = homannAngle(d, d.turns_remaining);


      // unrotated elipse point
      var dx = a * Math.cos(angle);
      var dy = b * Math.sin(angle);

      // unrotated slope
      var t1 = (dx * Math.pow(b, 2)) / (dy * Math.pow(a, 2))

      var sx = t1 * Math.cos(w) - Math.sin(w);
      var sy = Math.cos(w) + t1 * Math.sin(w);

      var degrees = toDegrees(Math.atan2(sy, sx));
      return 'rotate(' + (degrees + 180) % 360 + ')';
    })

  // Old expeditions to remove
  expeditions.exit().remove();
}

function parseJson(e) {
  var reader = new FileReader();
  reader.onload = event => {
    parsed = JSON.parse(event.target.result);
    setupPatterns(svg);
    var data = parsed.turns[0];
    init(data);
    prepareData(data);
    update(data);

    //TODO do this better
    attachEvents(parsed.turns.length - 1, toggleTimer, showTurn);

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

function nextTurn() {
  return showTurn(parseInt(turn) + 1);
}

function showTurn(newTurn) {
  if (newTurn >= parsed.turns.length) {
    console.log("end of log");
    return false;
  } else {
    var lastTurn = turn;
    setTurn(newTurn);
    var data = parsed.turns[newTurn];
    data.lastTurn = lastTurn;
    data.planet_map = parsed.turns[0].planet_map;
    data.color_map = parsed.turns[0].color_map;
    prepareData(data);
    update(data);
    updateAnimations(data);
    return true;
  }
}

function translation(point) {
  return 'translate(' + point.x + ',' + point.y + ')';
}

//Timer functions

function toggleTimer() {
  if (!turn_timer || turn_timer._time === Infinity) {
    startTimer();
    return true;
  } else {
    stopTimer();
    return false;
  }
}

function startTimer() {
  var callback = e => {
    // 20 might seem like a magic number
    // D3 docs say it will at least take 15 ms to draw frame
    if (e % speed < 20 && !nextTurn()) stopTimer();
  };
  turn_timer = d3.timer(callback);
}

function stopTimer() {
  turn_timer.stop();
}

// Help functions

function randomIntBetween(min, max) {
  return Math.floor(randomBetween(min, max));
}

function randomBetween(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function euclideanDistance(e1, e2) {
  return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
}

function relativeCoords(expedition) {
  var total_distance = Math.ceil(euclideanDistance(expedition.origin_object, expedition.destination_object));
  var mod = expedition.turns_remaining / total_distance;

  var new_x = expedition.origin_object.x - expedition.destination_object.x;
  new_x *= mod;
  new_x += expedition.destination_object.x;

  var new_y = expedition.origin_object.y - expedition.destination_object.y;
  new_y *= mod;
  new_y += expedition.destination_object.y;

  return {
    'x': new_x,
    'y': new_y
  };
}

function homannPosition(expedition, angle) {
  var total_distance = euclideanDistance(expedition.origin_object, expedition.destination_object);
  if (!angle) angle = homannAngle(expedition, expedition.turns_remaining, total_distance);

  var r1 = (expedition.origin_object.size) / 2 + 3;
  var r2 = (expedition.destination_object.size) / 2 + 3;

  var a = (total_distance + r1 + r2) / 2;
  var c = a - r1 / 2 - r2 / 2;
  var b = Math.sqrt(Math.pow(a, 2) - Math.pow(c, 2));

  var dx = expedition.origin_object.x - expedition.destination_object.x;
  var dy = expedition.origin_object.y - expedition.destination_object.y;
  var w = Math.atan2(dy, dx);

  var center_x = c * Math.cos(w) + expedition.destination_object.x;
  var center_y = c * Math.sin(w) + expedition.destination_object.y;

  var longest = a;
  var shortest = b;

  longest *= Math.cos(angle);
  shortest *= Math.sin(angle);

  return {
    'x': center_x + longest * Math.cos(w) - shortest * Math.sin(w),
    'y': center_y + longest * Math.sin(w) + shortest * Math.cos(w)
  };
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

function homannAngle(expedition, turn, distance) {
  if (!distance) distance = euclideanDistance(expedition.origin_object, expedition.destination_object);
  var mod = turn / distance;
  return mod * (Math.PI * 2) - Math.PI;
}

function attachToAllChildren(d3selector) {
  return d3selector.data((d, i) => {
    return Array(d3selector._groups[i].length).fill(d);
  });
}

function setTurn(newTurn) {
  turn = newTurn;
  d3.select('#turn_slider').property('value', turn);
}
