const Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

module.exports = {
  'planets': function(block) {
    const filter_strs = {
      'ALL': '',
      'MINE': 'p => p.owner == getPlayer()',
      'HOSTILE': 'p => p.owner != getPlayer()',
      'NEUTRAL': 'p => !p.owner',
      'ENEMY': 'p => p.owner && p.owner != getPlayer()'
    };

    let filter_str = filter_strs[block.getFieldValue('FILTER')];
    let code = `getPlanets(${filter_str})`;
    return [code, JS.ORDER_ATOMIC];
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
