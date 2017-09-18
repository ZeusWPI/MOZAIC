var Blockly = require("node-blockly/browser");

const MAGIC_OBJECT_COLOR = 275;

Blockly.Blocks['planets'] = {
  init: function() {
    this.appendDummyInput().appendField('Planets');
    this.setColour(MAGIC_OBJECT_COLOR);
    this.setOutput(true, 'List');
  }
};

Blockly.Blocks['expeditions'] = {
  init: function() {
    this.appendDummyInput().appendField('Expeditions');
    this.setColour(MAGIC_OBJECT_COLOR);
    this.setOutput(true, 'List');
  }
};

Blockly.Blocks['players'] = {
  init: function() {
    this.appendDummyInput().appendField('Players');
    this.setColour(MAGIC_OBJECT_COLOR);
    this.setOutput(true, 'List');
  }
}
