var Blockly = require('node-blockly/browser');

module.exports = {
  'list_filter': function(block) {
    var list = Blockly.JavaScript.valueToCode(block, 'LIST');
    var predicate = Blockly.JavaScript.valueToCode(block, 'PREDICATE');
    var elem_name = Blockly.JavaScript.variableDB_.getName(
      block.getFieldValue('ELEM_NAME'),
      Blockly.Variables.NAME_TYPE
    );

    var pred_str = '(' + elem_name + ') => ' + predicate;
    return list + '.filter(' + pred_str + ')';
  },
  'list_minmax': function(block) {
    // TODO
  }
};
