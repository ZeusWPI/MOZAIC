const PlanetWars = require ('./planetwars');
const eval_code = require('./eval_code');

var state = {
  "players": [
    "timp",
    "bert"
  ],
  "planets": [
    {
      "ship_count": 6,
      "x": 6,
      "y": 0,
      "owner": "timp",
      "name": "tetartos"
    },
    {
      "ship_count": 6,
      "x": -3,
      "y": -5,
      "owner": null,
      "name": "extos"
    },
    {
      "ship_count": 6,
      "x": 3,
      "y": 5,
      "owner": null,
      "name": "tritos"
    },
    {
      "ship_count": 6,
      "x": 3,
      "y": -5,
      "owner": null,
      "name": "pemptos"
    },
    {
      "ship_count": 6,
      "x": -3,
      "y": 5,
      "owner": null,
      "name": "duteros"
    },
    {
      "ship_count": 6,
      "x": -6,
      "y": 0,
      "owner": "bert",
      "name": "protos"
    }
  ],
  "expeditions": []
};

var player_name = "bert";

var pw = new PlanetWars(player_name);
pw.setState(state);

// fetches closures that act on a given PlanetWars instance


function test_code(code) {
  return eval_code(code, pw, 'bert');
}

module.exports = test_code;
