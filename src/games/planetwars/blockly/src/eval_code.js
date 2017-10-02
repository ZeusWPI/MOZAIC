'use strict';

const { minimum_by, maximum_by, distance, sort_by } = require('./utils');

function eval_code(code, pw) {

  // define closures
  function getPlayer() {
    return pw.getPlayer();
  }

  function getPlayers() {
    return pw.getPlayers();
  }

  function getPlanets(predicate) {
    return pw.getPlanets(predicate);
  }

  function getExpeditions(predicate) {
    return pw.getExpeditions(predicate);
  }

  function getPlanet(name) {
    return pw.getPlanet(name);
  }

  function dispatch(num_ships, origin, target) {
    pw.dispatch(num_ships, origin, target);
  }

  // evaluate code
  return eval(code);
}

module.exports = eval_code;
