const data = {
  "players": [
    "Lorin",
    "Tim"
  ],
  "planets": [
    {
      "x": 10,
      "y": 10,
      "ship_count": 30,
      "owner": "Lorin",
      "name": "Mercurius"
    },
    {
      "x": 20,
      "y": 20,
      "ship_count": 20,
      "owner": "Tim",
      "name": "Venus"
    }
  ],
  "expeditions": [
    {
      "ship_count": 10,
      "origin": "Mercurius",
      "destination": "Venus",
      "owner": "Tim",
      "turns_remaining": 10,
    }
  ]
}

const color = d3.scaleOrdinal(d3.schemeCategory10);
const color_map = data.players.reduce((map, o, i) => {
  map[o] = color(i);
  return map;
}, {});

const planet_map = data.planets.reduce((map, o) => {
  map[o.name] = o;
  return map;
}, {});

data.expeditions.map((e) => {
  e.origin = planet_map[e.origin];
  e.destination = planet_map[e.destination];
});

const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

function euclideanDistance(e1, e2) {
  return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
}

function relativeCoords(expedition) {
  var total_distance = Math.ceil(euclideanDistance(expedition.origin, expedition.destination));
  var mod = expedition.turns_remaining / total_distance;

  var new_x = expedition.destination.x - expedition.origin.x;
  new_x *= mod;
  new_x += expedition.origin.x;

  var new_y = expedition.destination.y - expedition.origin.y;
  new_y *= mod;
  new_y += expedition.origin.y;

  console.log({'x': expedition.origin * mod });
  return {'x': new_x, 'y': new_y };
}

d3.select("body")
  .selectAll("p")
  .data(data.players)
  .enter().append("p")
    .text((d, i) => `I’m called ${d}!`)
    .style('color', (d, i) => color(i))
    ;

console.log(color_map);
svg.selectAll('.planet')
   .data(data.planets)
   .enter().append('circle')
   .attr('class', 'planet')
   .attr('cx', d => d.x * 20)
   .attr('cy', d => d.y * 20)
   .attr('r', 40)
   .attr('fill', d => color_map[d.owner])
   ;

svg.selectAll('.expedition')
   .data(data.expeditions)
   .enter().append('circle')
   .attr('cx', d => {
     return relativeCoords(d).x * 20;
   })
   .attr('cy', d => {
     return relativeCoords(d).y * 20;
   })
   .attr('r', 10)
   ;

console.log(euclideanDistance(data.planets[0], data.planets[1]));
