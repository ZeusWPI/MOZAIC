var Blockly = require("node-blockly/browser");

Blockly.Blocks['planets'] = {
  init: function() {
    this.appendDummyInput().appendField('Planets');
    this.setColour(275);
    this.setOutput(true, 'List');
  }
};

Blockly.Blocks['expeditions'] = {
  init: function() {
    this.appendDummyInput().appendField('Expeditions');
    this.setColour(275);
    this.setOutput(true, 'List');
  }
};
