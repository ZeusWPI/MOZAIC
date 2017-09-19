var Blockly = require("node-blockly/browser");

const CONSTANT_COLOR = 275;
const ATTRIBUTE_COLOR = 180;

const constants = {
  'planets': {
    init: function() {
      this.appendDummyInput().appendField('Planets');
      this.setColour(CONSTANT_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'expeditions': {
    init: function() {
      this.appendDummyInput().appendField('Expeditions');
      this.setColour(CONSTANT_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'players': {
    init: function() {
      this.appendDummyInput().appendField('Players');
      this.setColour(CONSTANT_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'player_me': {
    init: function() {
      this.appendDummyInput().appendField('Me');
      this.setColour(CONSTANT_COLOR);
      this.setOutput(true, 'Player');
    }
  },
  'player_nobody': {
    init: function() {
      this.appendDummyInput().appendField('Nobody');
      this.setColour(CONSTANT_COLOR);
      this.setOutput(true, 'Player');
    }
  }
};

const attributes = {
  'attr_owner': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('owner of');
      this.setColour(ATTRIBUTE_COLOR);
      this.setOutput(true, 'Player');
    }
  },
  'attr_ship_count': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('fleet size of');
      this.setColour(ATTRIBUTE_COLOR);
      this.setOutput(true, 'Number');
    }
  }
};

module.exports = {
  'constants': constants,
  'attributes': attributes
};
