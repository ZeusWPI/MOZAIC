// Constants

const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");
const planet_types = ["water", "red", "moon", "mars", "earth"];


//TODO use for viewport
const scale = 20;

var base_speed = 1000;
// TODO bind this to a control
// current speed
var speed = 1000;

var turn_timer;

//current turn
var turn = 0;

// Parsed input json
var parsed;

function setupPatterns(svg) {
  // Define patterns
  planet_types.forEach(p => {
    svg.append("defs")
      .append("pattern")
      .attr("id", p)
      .attr("viewBox", "0 0 100 100")
      .attr("preserveAspectRation", "none")
      .attr("width", 1)
      .attr("height", 1)
      .append("image")
      .attr("width", 100)
      .attr("height", 100)
      .attr("preserveAspectRation", "none")
      .attr("xlink:href", "res/" + p + ".png");
  });

  svg.select("defs")
    .append("pattern")
    .attr("id", "ship")
    .attr("viewBox", "0 0 100 100")
    .attr("preserveAspectRation", "none")
    .attr("width", 1)
    .attr("height", 1)
    .append("image")
    .attr("width", 100)
    .attr("height", 100)
    .attr("preserveAspectRation", "none")
    .attr("xlink:href", "res/rocket.png");
}

function init(data) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  data.color_map = data.players.reduce((map, o, i) => {
    map[o] = color(i);
    return map;
  }, {});

  data.planets.map(e => {
    e.x *= scale;
    e.y *= scale;
  });

  data.planet_map = data.planets.reduce((map, o) => {
    o.type = planet_types[Math.floor(Math.random() * planet_types.length)];
    o.size = randomBetween(20, 60);
    map[o.name] = o;
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
    .attr('y', d => d.y + d.size + 20)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => d.name)
    .append('title')
    .text(d => d.owner);

  d3selector.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 60)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);
}

function addFleets(d3selector, data) {
  d3selector.append('circle')
    .attr('class', 'orbit')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')')
    .attr('r', d => d.distance)
    .style('fill', "none")
    .style('stroke', d => data.color_map[d.planet.owner]);

  var wrapper = d3selector.append('g')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')');

  wrapper.append('circle')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')')
    .attr('class', 'fleet')
    .attr('r', d => d.size)
    .attr('cx', d => d.distance)
    .attr('cy', 0)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.planet.owner);

}

function addExpeditions(d3selector, data) {
  d3selector.attr('transform', d => transition(d));

  d3selector.append('circle')
    .attr('transform', (d, i) => {
      return 'rotate(' + (Math.atan2(d.destination_object.y - d.origin_object.y, d.destination_object.x - d.origin_object.x) * (180 / Math.PI) + 90) + ')';
    })
    .attr('r', 20)
    .style('stroke', d => data.color_map[d.owner])
    .style('stroke-width', 2)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.owner);

  d3selector.append('text')
    .attr('y', 40)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);
}

function update(data) {
  // Planets
  var planets = svg.selectAll('.planet_wrapper').data(data.planets, d => d.name);
  var expeditions = svg.selectAll('.expedition')
    .data(data.expeditions, d => {
      return d.id;
    });

  // Fleets for planets

  var new_planets = planets.enter().append('g').attr('class', 'planet_wrapper');
  var fleet_wrapper = new_planets.append('g')
    .data(data.planets.map(d => {
      return {
        size: 20,
        distance: d.size + 40,
        angle: randomBetween(1, 360),
        speed: randomBetween(100, 1000),
        planet: d
      };
    }));
  var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition');

  addPlanets(new_planets, data);
  addFleets(fleet_wrapper, data);
  addExpeditions(new_expeditions, data);
}

function updateAnimations(data) {
  var planets = svg.selectAll('.planet_wrapper').data(data.planets, d => d.name);
  var expeditions = svg.selectAll('.expedition');
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

  // EXPEDITIONS
  var t = d3.transition()
    .duration(speed)
    .ease(d3.easeLinear);

  expeditions.transition(t)
    .attr('transform', d => transition(d));

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
        //.data(fleets)
        .attr('transform', (d, i) => {
          return 'rotate(' + (d.angle - elapsed * (d.speed / 10000)) % 360 + ')';
        });
    });
  }
  reader.readAsText(e.files[0]);

}

function nextTurn() {
  turn++;
  return showTurn(turn);
}

function showTurn(newTurn) {
  if (newTurn >= parsed.turns.length) {
    console.log("end of log");
    return false;
  } else {
    setTurn(newTurn);
    var data = parsed.turns[newTurn];
    data.planet_map = parsed.turns[0].planet_map;
    data.color_map = parsed.turns[0].color_map;
    prepareData(data);
    update(data);
    updateAnimations(data);
    return true;
  }
}

function transition(expedition) {
  var point = relativeCoords(expedition);
  return 'translate(' + point.x + ',' + point.y + ')';
}

//Timer functions

function toggleTimer() {
  if (!turn_timer || turn_timer._time === Infinity) {
    startTimer();
  } else {
    stopTimer();
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

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function euclideanDistance(e1, e2) {
  return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
}

function relativeCoords(expedition) {
  var total_distance = Math.ceil(euclideanDistance(expedition.origin_object, expedition.destination_object)) / scale;
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

function attachToAllChildren(d3selector) {
  return d3selector.data((d, i) => {
    return Array(d3selector._groups[i].length).fill(d);
  });
}

function setTurn(newTurn) {
  turn = newTurn;
  console.log(turn);
  d3.select('#turn_slider').property('value', turn);
}
