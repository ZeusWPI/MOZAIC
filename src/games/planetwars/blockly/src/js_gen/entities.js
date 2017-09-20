var Blockly = require('node-blockly'); 

module.exports = {
  'planets': function(block) {
    return 'getPlanets()';
  },
  'expeditions': function(block) {
    return 'getExpeditions()';
  },
  'players': function(block) {
    return 'getPlayers()';
  },
  'player_name': function(block) {
    return 'getPlayer()';
  },
  'nobody': function(block) {
    return 'null';
  }
}
