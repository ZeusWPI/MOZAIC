const Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

const ALLEGIANCE_FILTERS = {
  'ALL': '',
  'MINE': 'p => p.owner == getPlayer()',
  'HOSTILE': 'p => p.owner != getPlayer()',
  'NEUTRAL': 'p => !p.owner',
  'ENEMY': 'p => p.owner && p.owner != getPlayer()'
};

module.exports = {
  'planets': function(block) {
    let filter_str = ALLEGIANCE_FILTERS[block.getFieldValue('ALLEGIANCE')];
    let code = `getPlanets(${filter_str})`;
    return [code, JS.ORDER_ATOMIC];
  },
  'expeditions': function(block) {
    let filter_str = ALLEGIANCE_FILTERS[block.getFieldValue('ALLEGIANCE')];
    let code = `getExpeditions(${filter_str})`;
    return [code, JS.ORDER_ATOMIC];
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
