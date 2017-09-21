class PlanetWars {
  constructor(player) {
    this.state = EMPTY_STATE;
    this.player = player;
    this.planet_map = {};
  }

  setState(state) {
    this.state = state;
    this.rebuildPlanetMap();
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

  distance(p1, p2) {
  }

  dispatch(num_ships, origin, target) {
    // TODO
  }
}

const EMPTY_STATE = {
  'players': [],
  'planets': [],
  'expeditions': []
};

module.exports = PlanetWars;
