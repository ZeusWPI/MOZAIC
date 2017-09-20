const Interpreter = require('js-interpreter');
const PlanetWars = require ('./planetwars');
const CodeInjector = require ('./injector');

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
function getPlayer() {
  return pw.getPlayer();
}

function getPlayers() {
  return pw.getPlayers();
}

function getPlanets() {
  return pw.getPlanets();
}

function getExpeditions() {
  return pw.getExpeditions();
}

function getPlanet(name) {
  return pw.getPlanet(name);
}

function dispatch(num_ships, origin, target) {
  pw.dispatch(num_ships, orgin, target);
}


function eval_code(code) {
  'use strict';
  let res = eval(code);
  console.log(res);
}

module.exports = eval_code;
