var Blockly = require("node-blockly/browser");
const PW_COLOUR = 93;
Blockly.Blocks['entities'] = { HUE: PW_COLOUR };

module.exports = {
  'planets': {
    init: function() {
      const options = [
        ['all', 'ALL'],
        ['my', 'MINE'],
        ['neutral', 'NEUTRAL'],
        ['enemy', 'ENEMY'],
        ['hostile', 'HOSTILE']
      ];
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(options), 'FILTER')
        .appendField('Planets');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
      this.setTooltip('Returns a list of all planets.');
    }
  },
  'expeditions': {
    init: function() {
      this.appendDummyInput().appendField('Expeditions');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
      this.setTooltip('Returns a list of all expeditions.');
    }
  },
  'players': {
    init: function() {
      this.appendDummyInput().appendField('Players');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'List');
      this.setTooltip('Returns a list of all players.');
    }
  },
  'player': {
    init: function() {
      this.appendDummyInput().appendField('Me');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Player');
      this.setTooltip('Returns the player (you).');
    }
  },
  'nobody': {
    init: function() {
      this.appendDummyInput().appendField('Nobody');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Player');
      this.setTooltip('Returns the "nobody" player (the player that occupies the unconquered planets).');
    }
  }
};
