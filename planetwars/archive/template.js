var readline = require('readline');
var fs = require("fs");

let dispatches = [];
let hasMeta = false;

function minimum_by(list, fun) {
    let idx = list.map(fun).reduce((acc, x, i, arr) => x < arr[acc] ? i : acc, 0);
    return list[idx];
  }
  
  function maximum_by(list, fun) {
    let idx = list.map(fun).reduce((acc, x, i, arr) => x > arr[acc] ? i : acc, 0);
    return list[idx];
  }
  
  function sort_by(list, fun) {
    var mapped = list.map( (elem, i) => {
      return { index: i, value: fun(elem)};
    });
    mapped.sort((a, b) => a.value - b.value);
    return mapped.map(elem => list[elem.index]);
  }
  
  function distance(p1, p2) {
    let dx = p1['x'] - p2['x'];
    let dy = p1['y'] - p2['y'];
    let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return Math.ceil(dist);
  }

function getPlayer() {
    return this.player
}

function getPlayers() {
    return this.lastState.planets.map((planet) => planet.owner)
                                 .filter((owner, index) => owner && indexOf(owner) === index)
}

function getPlanets(predicate) {
    if (predicate) {
        return this.lastState.planets.filter(predicate);
    } else {
        return this.lastState.planets;
    }
}

function getPlanet(name) {
    return this.lastState.planets.filter((planet) => planet.name === name)[0]
}

function getExpeditions(predicate) {
    if (predicate) {
      return this.state.expeditions.filter(predicate);
    } else {
      return this.state.expeditions;
    }
}

function dispatch(num_ships_, origin, target) {
    if (origin.owner == getPlayer()) {
      let num_ships = Math.min(origin.ship_count, num_ships_);
      origin.ship_count -= num_ships;
      dispatches.push({
        'ship_count': num_ships,
        'origin': origin['name'],
        'destination': target['name']
      });
    }
}

function parseMeta(line) {
    const meta = JSON.parse(line)
    this.player = meta.player_number
    hasMeta = true
}

function parseState(line) {
    this.lastState = JSON.parse(line)

    CODEHEREPLZ

    console.log(JSON.stringify({ moves: dispatches }))

    dispatches = []
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
    if (!hasMeta) {
        parseMeta(line)
    } else {
        parseState(line)
    }
})