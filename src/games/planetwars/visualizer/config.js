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
  player_color: player => {
    //TODO
    return '#d3d3d3';
  },
  player_name: player => {
    if (player) {
      return player;
    } else {
      return 'Nobody';
    }
  }
};
