const Blockly = require('node-blockly');
const JS = Blockly.JavaScript;

module.exports = {
  'planets': function(block) {
    return ['getPlanets()', JS.ORDER_ATOMIC];
  },
  'expeditions': function(block) {
    return ['getExpeditions()', JS.ORDER_ATOMIC];
  },
  'players': function(block) {
    return ['getPlayers()', JS.ORDER_ATOMIC];
  },
  'player': function(block) {
    return ['getPlayer()', JS.ORDER_ATOMIC];
  },
  'nobody': function(block) {
    return ['null', JS.ORDER_ATOMIC];
  }
};
