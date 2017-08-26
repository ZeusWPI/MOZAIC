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
    e.origin = data.planet_map[e.origin];
    e.destination = data.planet_map[e.destination];
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

function update(data) {
  // Planets
  var planets = svg.selectAll('.planet').data(data.planets, d => d.name);
  var new_planets = planets.enter().append('g').attr('class', 'planet');

  new_planets.append('circle')
    .attr("r", d => d.size)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('fill', d => "url(#" + d.type + ")")
    .append('title')
    .text(d => d.owner);

  new_planets.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 20)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => d.name)
    .append('title')
    .text(d => d.owner);

  new_planets.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 60)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);

  // Fleets for planets

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

  fleet_wrapper.append('circle')
    .attr('class', 'orbit')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')')
    .attr('r', d => d.distance)
    .style('fill', "none")
    .style('stroke', d => data.color_map[d.planet.owner]);

  var wrapper = fleet_wrapper.append('g')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')');

  wrapper.append('circle')
    .attr('transform', d => 'translate(' + d.planet.x + ',' + d.planet.y + ')')
    .attr('class', 'fleet')
    .attr('r', d => d.size)
    .attr('cx', d => d.distance)
    .attr('cy', 0)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.planet.owner);

  // Update planets
  attachToAllChildren(planets.selectAll('text')).attr('fill', d => data.color_map[d.owner]);
  attachToAllChildren(planets.selectAll('title')).text(d => d.owner);

  //Takeover transition
  planets.select('circle')
    .transition(speed / 2)
    .attr("r", d => {
      return d.changed_owner ? data.planet_map[d.name].size * 1.3 : data.planet_map[d.name].size;
    })
    .transition(speed / 2)
    .attr("r", d => data.planet_map[d.name].size);

  // Update orbits
  planets.select('.orbit').style('stroke', d => data.color_map[d.owner]);

  // Expeditions

  // New expeditions

  var expeditions = svg.selectAll('.expedition')
    .data(data.expeditions, d => {
      return d.id;
    });

  var new_expeditions = expeditions.enter().append('g').attr('class', 'expedition')
    .attr('transform', d => 'translate(' + relativeCoords(d).x + ',' + relativeCoords(d).y + ')');

  new_expeditions.append('circle')
    .attr('transform', (d, i) => {
      return 'rotate(' + (Math.atan2(d.destination.y - d.origin.y, d.destination.x - d.origin.x) * (180 / Math.PI) + 90) + ')';
    })
    .attr('r', 20)
    .style('stroke', d => data.color_map[d.owner])
    .style('stroke-width', 2)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.owner);

  new_expeditions.append('text')
    .attr('y', 40)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);

  // Expedition updates
  var t = d3.transition()
    .duration(speed)
    .ease(d3.easeLinear);

  expeditions.transition(t)
    .attr('transform', d => 'translate(' + relativeCoords(d).x + ',' + relativeCoords(d).y + ')');

  // Old expeditions to remove
  expeditions.exit().transition(t)
    .attr('transform', d => 'translate(' + relativeCoords(d).x + ',' + relativeCoords(d).y + ')').remove();
}

function parseJson(e) {
  var reader = new FileReader();
  reader.onload = event => {
    parsed = JSON.parse(event.target.result);
    setupPatterns(svg);
    var data = parsed.turns[0];
    //document.getElementById("next").addEventListener("click", nextTurn);
    init(data);
    prepareData(data);
    update(data);

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
  if (turn >= parsed.turns.length) {
    console.log("end of log");
    return false;
  } else {
    var data = parsed.turns[turn];
    // TODO do this data passing better
    data.planet_map = parsed.turns[turn - 1].planet_map;
    data.color_map = parsed.turns[turn - 1].color_map;

    prepareData(data);
    update(data);
    return true;
  }
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
  var total_distance = Math.ceil(euclideanDistance(expedition.origin, expedition.destination)) / scale;
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

function attachToAllChildren(selection) {
  return selection.data((d, i) => {
    return Array(selection._groups[i].length).fill(d);
  });
}
