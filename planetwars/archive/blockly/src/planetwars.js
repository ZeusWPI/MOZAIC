class PlanetWars {
  constructor(player, state) {
    this.state = state;
    this.player = player;
    this.dispatches = [];
    this.buildPlanetMap();
  }

  buildPlanetMap() {
    this.planet_map = {};
    this.getPlanets().forEach(planet => {
      this.planet_map[planet.name] = planet;
    });
  }
  
  getPlayer() {
    return this.player;
  }

  getPlayers() {
    return this.state.players;
  }

  getPlanets(predicate) {
    if (predicate) {
      return this.state.planets.filter(predicate);
    } else {
      return this.state.planets;
    }
  }

  getPlanet(name) {
    return this.planet_map[name];
  }

  getExpeditions(predicate) {
    if (predicate) {
      return this.state.expeditions.filter(predicate);
    } else {
      return this.state.expeditions;
    }
  }

  dispatch(num_ships_, origin, target) {
    if (origin.owner == this.player) {
      let num_ships = Math.min(origin.ship_count, num_ships_);
      origin.ship_count -= num_ships;
      this.dispatches.push({
        'ship_count': num_ships,
        'origin': origin['name'],
        'destination': target['name']
      });
    }
  }
}

module.exports = PlanetWars;
