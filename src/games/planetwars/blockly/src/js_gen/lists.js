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
    // TODO
  }
};
