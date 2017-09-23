class Config {
  static get planet_types() {
    return ["earth", "jupiter", "mars", "neptune", "sun", "uranus", "venus"];
  }

  static get max_planet_size() {
    return 2.5;
  }

  static get orbit_size() {
    return 1;
  }

  static get base_speed() {
    return 2000;
  }

  static get speed_mods() {
    return [0.33, 0.5, 0.75, 1, 2, 4, 6];
  }

  static get max_scales() {
    return [0.3, 3];
  }

}

module.exports = Config;
