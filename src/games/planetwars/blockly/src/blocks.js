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
};


Blockly.Blocks['get_owner'] = {
  init: function() {
    this.appendValueInput('OBJ')
      .setCheck(['Planet', 'Expedition'])
      .appendField('owner of');
    this.setOutput(true, 'Player');
  }
};

Blockly.Blocks['get_ship_count'] = {
  init: function() {
    this.appendValueInput('OBJ')
      .setCheck(['Planet', 'Expedition'])
      .appendField('fleet size of');
    this.setOutput(true, 'Number');
  }
};
