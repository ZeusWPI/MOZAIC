class PlanetWars {
  constructor(player) {
    this.state = EMPTY_STATE;
    this.player = player;
    this.planet_map = {};
    this.dispatches = [];
  }

  // set state and start a new turn
  setState(state) {
    this.state = state;
    this.rebuildPlanetMap();
    this.dispatches = [];
  }

  rebuildPlanetMap() {
    this.planet_map = {};
    this.getPlanets().forEach(planet => {
      this.planet_map[planet.name] = planet;
    });
  }
  
  getPlayer() {
    return this.player;
  }

  getPlayers() {
    return this.state['players'];
  }

  getPlanets() {
    return this.state['planets'];
  }

  getPlanet(name) {
    return this.planet_map[name];
  }

  getExpeditions() {
    return this.state['expeditions'];
  }

  dispatch(num_ships, origin, target) {
    this.dispatches.push({
      'num_ships': num_ships,
      'origin': origin['name'],
      'target': target['name']
    });
  }
}

const EMPTY_STATE = {
  'players': [],
  'planets': [],
  'expeditions': []
};

module.exports = PlanetWars;
