// miscellaneous data and general functions
module.exports = {
  planet_types: [
    'earth',
    'jupiter',
    'mars',
    'neptune',
    'sun',
    'uranus',
    'venus'
  ],
  max_planet_size: 2.5,
  orbit_size: 1,
  max_scales: [0.3, 3],
  // TODO: this is not the best way to do this ...
  player_color: player => {
    if (player) {
      return player.color;
    } else {
      return '#d3d3d3';
    }
  },
  player_name: player => {
    if (player) {
      return player.name;
    } else {
      return 'Nobody';
    }
  }
};
