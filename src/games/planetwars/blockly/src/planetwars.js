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

  distance(p1, p2) {
  }

  dispatch(num_ships, origin, target) {
    // TODO
  }

  // inject planetwars API into a javascript interpreter
  init_interpreter(interpreter, scope) {
    register_fn(interpreter, scope, 'getPlayers',function() {
      
    });
  }
}

module.exports = PlanetWars;
