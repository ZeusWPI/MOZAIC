var Blockly = require('node-blockly/browser');

const LIST_COLOUR = 225;

module.exports = {
    'filter': {
    init: function() {
      this.appendValueInput('LIST')
        .appendField('all')
        .appendField(new Blockly.FieldVariable('element'), 'ELEM_NAME')
        .appendField('in')
        .setCheck('List');
      this.appendValueInput('PREDICATE')
        .appendField('where')
        .setCheck('Boolean');
      this.setColour(LIST_COLOUR);
      this.setOutput(true, 'List');
    }
  },
  'minmax': {
    init: function() {
      const modes = [['minimizes', 'MINIMIZE'],
                     ['maximizes', 'MAXIMIZE']];
      this.appendValueInput('LIST')
        .appendField(new Blockly.FieldVariable('element'), 'ELEM_NAME')
        .appendField('in')

        .setCheck('List');
      this.appendValueInput('EXPR')
        .appendField('that')
        .appendField(new Blockly.FieldDropdown(modes), 'MODE')
        .setCheck('Number');
      this.setColour(LIST_COLOUR);
      this.setOutput(true);
    }
  }
};
