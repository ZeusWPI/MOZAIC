var Blockly = require("node-blockly/browser");

const MAGIC_OBJECT_COLOR = 275;

const constants = {
  'planets': {
    init: function() {
      this.appendDummyInput().appendField('Planets');
      this.setColour(MAGIC_OBJECT_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'expeditions': {
    init: function() {
      this.appendDummyInput().appendField('Expeditions');
      this.setColour(MAGIC_OBJECT_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'players': {
    init: function() {
      this.appendDummyInput().appendField('Players');
      this.setColour(MAGIC_OBJECT_COLOR);
      this.setOutput(true, 'List');
    }
  }
};

const attributes = {
  'attr_owner': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('owner of');
      this.setOutput(true, 'Player');
    }
  },
  'attr_ship_count': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('fleet size of');
      this.setOutput(true, 'Number');
    }
  }
};


module.exports = {
  'constants': constants,
  'attributes': attributes
};
