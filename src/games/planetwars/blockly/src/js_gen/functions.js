const Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

module.exports = {
  'fn_owner': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'OBJ');
    var code = arg + "['owner']";
    return [code, JS.ORDER_MEMBER];
  },
  'fn_ship_count': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'OBJ');
    var code = arg + "['ship_count']";
    return [code, JS.ORDER_MEMBER];
  },
  'fn_origin': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'EXPEDITION');
    var code = 'getPlanet(' + arg + "['origin'])";
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'fn_target': function(block) {
    var arg = Blockly.JavaScirpt.valueToCode(block, 'EXPEDITION');
    var code = 'getPlanet(' + arg + "['target'])";
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'fn_turns_remaining': function(block) {
    var arg = Blockly.JavaScript.valueToCode(block, 'EXPEDITION');
    var code = arg + "['turns_remaining']";
    return [code, JS.ORDER_MEMBER];
  },
  'fn_distance': function(block) {
    var p1 = Blockly.JavaScript.valueToCode(block, 'PLANET1');
    var p2 = Blockly.JavaScript.valueToCode(block, 'PLANET2');
    var code = 'distance(' + p1 + ', ' + p2 + ')';
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'fn_dispatch': function(block) {
    var num_ships = Blockly.JavaScript.valueToCode(block, 'SHIP_COUNT');
    var source = Blockly.JavaScript.valueToCode(block, 'SOURCE_PLANET');
    var target = Blockly.JavaScript.valueToCode(block, 'TARGET_PLANET');
    var code = 'dispatch('+ num_ships + ', ' + source + ', ' + target + ')';
    return [code, JS.ORDER_FUNCTION_CALL];
  }
};
