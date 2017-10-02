var Blockly = require("node-blockly/browser");
const PW_COLOUR = 93;
Blockly.Blocks['entities'] = { HUE: PW_COLOUR };

const PLANET_ALLEGIANCES = [
  ['all', 'ALL'],
  ['my', 'MINE'],
  ['neutral', 'NEUTRAL'],
  ['enemy', 'ENEMY'],
  ['hostile', 'HOSTILE']
];

const EXPEDITION_ALLEGIANCES = [
  ['all', 'ALL'],
  ['my', 'MINE'],
  ['hostile', 'HOSTILE']
];

module.exports = {
  'planets': {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(PLANET_ALLEGIANCES), 'ALLEGIANCE')
        .appendField('planets');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Array');
      this.setTooltip('Returns a list of all planets.');
    }
  },
  'expeditions': {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(EXPEDITION_ALLEGIANCES), 'ALLEGIANCE')
        .appendField('expeditions');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Array');
      this.setTooltip('Returns a list of all expeditions.');
    }
  },
  'players': {
    init: function() {
      this.appendDummyInput().appendField('Players');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Array');
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
