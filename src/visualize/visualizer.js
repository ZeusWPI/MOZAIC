const data = {
  "players": [
    "Lorin",
    "Tim",
    "Iepoev"
  ],
  "planets": [{
      "x": 10,
      "y": 10,
      "ship_count": 30,
      "owner": "Lorin",
      "name": "Mercurius"
    },
    {
      "x": 10,
      "y": 40,
      "ship_count": 20,
      "owner": "Tim",
      "name": "Venus"
    },
    {
      "x": 30,
      "y": 25,
      "ship_count": 20,
      "owner": "Lorin",
      "name": "Mars"
    },
    {
      "x": 40,
      "y": 12,
      "ship_count": 20,
      "owner": "Iepoev",
      "name": "Pluto"
    }
  ],
  "expeditions": [{
      "ship_count": 10,
      "origin": "Mercurius",
      "destination": "Venus",
      "owner": "Tim",
      "turns_remaining": 11,
    },
    {
      "ship_count": 10,
      "origin": "Mars",
      "destination": "Mercurius",
      "owner": "Lorin",
      "turns_remaining": 15,
    },
    {
      "ship_count": 10,
      "origin": "Mars",
      "destination": "Venus",
      "owner": "Lorin",
      "turns_remaining": 7,
    }
  ]
}

const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");


// Define patterns
const planet_types = ["water", "red", "moon", "mars", "earth"];
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

fleets = [];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const color = d3.scaleOrdinal(d3.schemeCategory10);
const color_map = data.players.reduce((map, o, i) => {
  map[o] = color(i);
  return map;
}, {});

const planet_map = data.planets.reduce((map, o) => {
  o.type = planet_types[Math.floor(Math.random() * planet_types.length)];
  o.size = randomBetween(20, 60);
  map[o.name] = o;
  return map;
}, {});

data.expeditions.map((e) => {
  e.origin = planet_map[e.origin];
  e.destination = planet_map[e.destination];
});

// Help functions

function euclideanDistance(e1, e2) {
  return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
}

function relativeCoords(expedition) {
  var total_distance = Math.ceil(euclideanDistance(expedition.origin, expedition.destination));
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

// Info

d3.select("body")
  .selectAll("p")
  .data(data.players)
  .enter().append("p")
  .text((d, i) => `I’m called ${d}!`)
  .style('color', (d, i) => color(i));

// Rendering

function renderOrbit(fleet, target) {
  console.log(target);
  time = Date.now();
  svg.append('circle')
    .attr('transform', 'translate(' + target.x * 20 + ',' + target.y * 20 + ')')
    .attr('r', fleet.distance)
    .style('fill', "none")
    .style('stroke', color_map[target.owner]);

  let wrapper = svg.append('g')
    .attr('transform', 'translate(' + target.x * 20 + ',' + target.y * 20 + ')');
  wrapper.append('circle')
    .attr('transform', 'translate(' + target.x * 20 + ',' + target.y * 20 + ')')
    .attr('class', 'fleet')
    .attr('r', fleet.size)
    .attr('cx', fleet.distance)
    .attr('cy', 0)
    .attr('fill', d => "url(#ship)");

  function renderFrame() {
    let delta = Date.now() - time;

    svg.selectAll('.fleet')
      .attr('transform', (d, i) => {
        return 'rotate(' + (fleets[i].angle - delta * (fleets[i].speed / 10000)) % 360 + ')';
      });
  }
  d3.timer(renderFrame);
}

// Planets

let planets = svg.selectAll('.planet')
  .data(data.planets)
  .enter();

planets.append('circle')
  .attr("r", d => d.size)
  .attr('class', 'planet')
  .attr('cx', d => d.x * 20)
  .attr('cy', d => d.y * 20)
  .attr('fill', d => "url(#" + d.type + ")");

planets.append('text')
  .attr('x', d => d.x * 20)
  .attr('y', d => d.y * 20 + d.size + 20)
  .attr("font-family", "sans-serif")
  .attr("font-size", "20px")
  .attr('fill', d => color_map[d.owner])
  .text(d => d.name);

planets.append('text')
  .attr('x', d => d.x * 20)
  .attr('y', d => d.y * 20 + d.size + 60)
  .attr("font-family", "sans-serif")
  .attr("font-size", "20px")
  .attr('fill', d => color_map[d.owner])
  .text(d => "\u2694 " + d.ship_count);

// Expeditions

let expeditions = svg.selectAll('.expedition')
  .data(data.expeditions)
  .enter().append('g')
  .attr('transform', d => 'translate(' + relativeCoords(d).x * 20 + ',' + relativeCoords(d).y * 20 + ')');
expeditions.append('circle')
  .attr('transform', (d, i) => {
    return 'rotate(' + (Math.atan2(d.destination.y - d.origin.y, d.destination.x - d.origin.x) * (180 / Math.PI) + 90) + ')';
  })
  .attr('r', 20)
  .style('stroke', d => color_map[d.owner])
  .style('stroke-width', 2)
  .attr('fill', d => "url(#ship)");

expeditions.append('text')
  .attr('y', 40)
  .attr("font-family", "sans-serif")
  .attr("font-size", "20px")
  .attr('fill', d => color_map[d.owner])
  .text(d => "\u2694 " + d.ship_count);

svg.selectAll('.planet').each(d => {
  fleet = {
    size: 20,
    distance: d.size + 40,
    angle: randomBetween(1, 360),
    speed: randomBetween(100, 1000),
    ship_count: d.ship_count,
    owner: d.owner
  };
  fleets.push(fleet);
  renderOrbit(fleet, d);
});
