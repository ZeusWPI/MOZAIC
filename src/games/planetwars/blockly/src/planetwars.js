class PlanetWars {
  constructor(player) {
    this.state = {};
    this.player = player;
  }

  setState(state) {
    this.state = state;
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

  getPlanet() {
    // TODO
  }

  getExpeditions() {
    return this.state['expeditions'];
  }

  dispatch(num_ships, origin, target) {
    // TODO
  }
}

module.exports = PlanetWars;
