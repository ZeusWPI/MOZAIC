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
  minPlanetSize: 1,
  orbitSize: 1,
  padding: 5,
  maxScales: [0.3, 3] as [number, number],
  neutralColor: '#d3d3d3',
  // Taken from d3's category20
  playerColors: [
    // '#ff7f0e', // orange
    // '#1f77b4', // blue
    // '#d62728', // red
    // '#9467bd', // purple
    '#DE8D47', // (orange) Main Primary color
    '#2C8286', // (teal) Main Complement color
    '#9ECE43', // (green) Free style
    '#DE4B47', // (red) Free style
    '#553C99', // (purple) Main Secondary color (2)
    '#B4397C', // (pink) Adjacent
    '#DEC547', // (yellow) Main Secondary color (1)
  ],
  playerName: (player: any) => {
    if (player) {
      return player.name;
    } else {
      return 'Nobody';
    }
  },
};
