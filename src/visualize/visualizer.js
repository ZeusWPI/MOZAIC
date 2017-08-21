// Constants

const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");
const planet_types = ["water", "red", "moon", "mars", "earth"];


//TODO use for viewport
const scale = 20;

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
      .attr("xlink:href", p + ".png");
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
    .attr("xlink:href", "rocket.png");
}

function prepareData(data) {
  data.fleets = [];

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

  data.expeditions.map((e) => {
    e.origin = data.planet_map[e.origin];
    e.destination = data.planet_map[e.destination];
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

// Rendering

function renderOrbit(fleets, fleet, target) {
  time = Date.now();
  svg.append('circle')
    .attr('transform', 'translate(' + target.x + ',' + target.y + ')')
    .attr('r', fleet.distance)
    .style('fill', "none")
    .style('stroke', fleet.color);

  let wrapper = svg.append('g')
    .attr('transform', 'translate(' + target.x + ',' + target.y + ')');
  wrapper.append('circle')
    .attr('transform', 'translate(' + target.x + ',' + target.y + ')')
    .attr('class', 'fleet')
    .attr('r', fleet.size)
    .attr('cx', fleet.distance)
    .attr('cy', 0)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => fleet.owner);

  function renderFrame() {
    let delta = Date.now() - time;

    svg.selectAll('.fleet')
      .attr('transform', (d, i) => {
        return 'rotate(' + (fleets[i].angle - delta * (fleets[i].speed / 10000)) % 360 + ')';
      });
  }
  d3.timer(renderFrame);
}

function generateMap(data) {
  // Planets

  let planets = svg.selectAll('.planet')
    .data(data.planets)
    .enter();

  planets.append('circle')
    .attr("r", d => d.size)
    .attr('class', 'planet')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('fill', d => "url(#" + d.type + ")")
    .append('title').text(d => d.owner);

  planets.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 20)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => d.name)
    .append('title').text(d => d.owner);;

  planets.append('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y + d.size + 60)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);

  // Expeditions

  let expeditions = svg.selectAll('.expedition')
    .data(data.expeditions)
    .enter().append('g')
    .attr('transform', d => 'translate(' + relativeCoords(d).x + ',' + relativeCoords(d).y + ')');
  expeditions.append('circle')
    .attr('transform', (d, i) => {
      return 'rotate(' + (Math.atan2(d.destination.y - d.origin.y, d.destination.x - d.origin.x) * (180 / Math.PI) + 90) + ')';
    })
    .attr('r', 20)
    .style('stroke', d => data.color_map[d.owner])
    .style('stroke-width', 2)
    .attr('fill', d => "url(#ship)")
    .append('title').text(d => d.owner);

  expeditions.append('text')
    .attr('y', 40)
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr('fill', d => data.color_map[d.owner])
    .text(d => "\u2694 " + d.ship_count)
    .append('title').text(d => d.owner);

  svg.selectAll('.planet').each(d => {
    fleet = {
      size: 20,
      distance: d.size + 40,
      angle: randomBetween(1, 360),
      speed: randomBetween(100, 1000),
      ship_count: d.ship_count,
      owner: d.owner,
      color: data.color_map[d.owner]
    };
    data.fleets.push(fleet);
    renderOrbit(data.fleets, fleet, d);
  });
}

function parseJson(e) {
  var reader = new FileReader();
  reader.onload = event => {
    var parsed = JSON.parse(event.target.result);
    setupPatterns(svg);
    var data = parsed.turns[0];
    prepareData(data);
    generateMap(data);
  }
  reader.readAsText(e.files[0]);
}
