// miscellaneous data and general functions
export default {
  planet_types: [
    'earth',
    'jupiter',
    'mars',
    'neptune',
    'sun',
    'uranus',
    'venus',
  ],
  planet_size: 1,
  max_planet_size: 2.5,
  orbit_size: 1,
  padding: 5,
  max_scales: [0.3, 3] as [number, number],
  // TODO: this is not the best way to do this ...
  playerColor: (player: any) => {
    if (player) {
      return player.color;
    } else {
      return '#d3d3d3';
    }
  },
  playerName: (player: any) => {
    if (player) {
      return player.name;
    } else {
      return 'Nobody';
    }
  },
};
