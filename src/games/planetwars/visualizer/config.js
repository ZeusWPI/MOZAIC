class Config {
  static get planet_types() {
    // return ["water", "red", "moon", "mars", "earth"];
    return ["earth", "jupiter", "mars", "neptune", "sun", "uranus", "venus"];
  }

  static get max_planet_size() {
    return 2.5;
  }

  static get orbit_size() {
    return 1;
  }

  static get base_speed() {
    return 1000;
  }

  static get speed_mods() {
    return [0.25, 0.33, 0.5, 1, 2, 3, 4];
  }

  static get max_scales() {
    return [0.3, 3];
  }

}

module.exports = Config;
