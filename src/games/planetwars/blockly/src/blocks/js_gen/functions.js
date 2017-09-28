const Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

module.exports = {
  'owner': function(block) {
    var arg = JS.valueToCode(block, 'OBJ');
    var code = `${arg}.owner`;
    return [code, JS.ORDER_MEMBER];
  },
  'ship_count': function(block) {
    var arg = JS.valueToCode(block, 'OBJ');
    var code = `${arg}.ship_count`;
    return [code, JS.ORDER_MEMBER];
  },
  'origin': function(block) {
    var arg = JS.valueToCode(block, 'EXPEDITION');
    var code = `getPlanet(${arg}.origin)`;
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'target': function(block) {
    var arg = JS.valueToCode(block, 'EXPEDITION');
    var code = `getPlanet(${arg}.target)`;
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'turns_remaining': function(block) {
    var arg = JS.valueToCode(block, 'EXPEDITION');
    var code = `${arg}.turns_remaining`;
    return [code, JS.ORDER_MEMBER];
  },
  'distance': function(block) {
    var p1 = JS.valueToCode(block, 'PLANET1');
    var p2 = JS.valueToCode(block, 'PLANET2');
    var code = `distance(${p1}, ${p2})`;
    return [code, JS.ORDER_FUNCTION_CALL];
  },
  'dispatch': function(block) {
    var num_ships = JS.valueToCode(block, 'SHIP_COUNT');
    var source = JS.valueToCode(block, 'SOURCE_PLANET');
    var target = JS.valueToCode(block, 'TARGET_PLANET');
    return `dispatch(${num_ships}, ${source}, ${target});\n`;
  }
};
