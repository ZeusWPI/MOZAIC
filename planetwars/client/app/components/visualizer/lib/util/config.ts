// miscellaneous data and general functions
export default {
  planetTypes: [
    'earth',
    'jupiter',
    'mars',
    'neptune',
    'sun',
    'uranus',
    'venus',
  ],
  planetSize: 1,
  maxPlanetSize: 2.5,
  orbitSize: 1,
  padding: 5,
  maxScales: [0.3, 3] as [number, number],
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
