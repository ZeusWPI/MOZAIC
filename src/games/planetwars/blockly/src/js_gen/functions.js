var Blockly = require('node-blockly/browser');

module.exports = {
  'fn_owner': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'OBJ');
    return arg + "['owner']";
  },
  'fn_ship_count': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'OBJ');
    return arg + "['ship_count']";
  },
  'fn_origin': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'EXPEDITION');
    return 'getPlanet(' + arg + "['origin'])";
  },
  'fn_target': function(block) {
    var arg = Blockly.JavaScirpt.valueToCode(block, 'EXPEDITION');
    return 'getPlanet(' + arg + "['target'])";
  },
  'fn_turns_remaining': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'EXPEDITION');
    return arg + "['turns_remaining']";
  },
  'fn_distance': function(block) {
    var p1 = Blockly.JavaScript.valueToCode(block, 'PLANET1');
    var p2 = Blockly.JavaScript.valueToCode(block, 'PLANET2');
    return 'distance(' + p1 + ', ' + p2 + ')';
  },
  'fn_dispatch': function(block) {
    var num_ships = Blockly.JavaScript.valueToCode(block, 'SHIP_COUNT');
    var source = Blockly.JavaScript.valueToCode(block, 'SOURCE_PLANET');
    var target = Blockly.JavaScript.valueToCode(block, 'TARGET_PLANET');
    return 'dispatch('+ num_ships + ', ' + source + ', ' + target + ')';
  }
  
};
