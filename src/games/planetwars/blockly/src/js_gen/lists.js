var Blockly = require('node-blockly/browser');
const JS = Blockly.JavaScript;

module.exports = {
  'list_filter': function(block) {
    var list = Blockly.JavaScript.valueToCode(block, 'LIST');
    var predicate = Blockly.JavaScript.valueToCode(block, 'PREDICATE');
    var elem_name = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var pred_str = '(' + elem_name + ') => ' + predicate;
    var code = list + '.filter(' + pred_str + ')';
    return [code, JS.ORDER_MEMBER];
  },
  'list_minmax': function(block) {
    var list = JS.valueToCode(block, 'LIST');
    var value_expr = JS.valueToCode(block, 'EXPR');

    var elem_name = JS.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var fn_str = '(' + elem_name + ') => ' + value_expr;

    var code;
    if (block.getFieldValue('MODE') == 'MINIMIZE') {
      code = 'minimum_by(' + list + ', ' + fn_str + ')';
    } else {
      code = 'maximum_by(' + list + ', ' + fn_str + ')';
    }
    return [code, JS.ORDER_FUNCTION_CALL];
  }
};
