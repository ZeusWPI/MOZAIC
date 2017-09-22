var Blockly = require("node-blockly/browser");
const PW_COLOUR = 275;
Blockly.Blocks['entities'] = { HUE: PW_COLOUR };

module.exports = {
  'planets': {
    init: function() {
      this.appendDummyInput().appendField('Planets');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
    }
  },
  'expeditions': {
    init: function() {
      this.appendDummyInput().appendField('Expeditions');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
    }
  },
  'players': {
    init: function() {
      this.appendDummyInput().appendField('Players');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
    }
  },
  'player': {
    init: function() {
      this.appendDummyInput().appendField('Me');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Player');
    }
  },
  'nobody': {
    init: function() {
      this.appendDummyInput().appendField('Nobody');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Player');
    }
  }
};
