var readline = require('readline');

let dispatches = [];
let hasMeta = false;

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
}

function parseState(line) {
    this.lastState = JSON.parse(line)

    // HERE BE CODE
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