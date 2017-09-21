'use strict';

const { minimum_by, maximum_by, distance } = require('./utils');

function eval_code(code, pw) {

  // define closures
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

  // evaluate code
  return eval(code);
}

module.exports = eval_code;
