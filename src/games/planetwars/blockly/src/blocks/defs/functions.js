var Blockly = require("node-blockly/browser");

const FN_COLOUR = 180;

module.exports = {
  'owner': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('owner of');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Player');
    }
  },
  'ship_count': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('fleet size of');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Number');
    }
  },
  'origin': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('origin of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Planet');
    }
  },
  'target': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('destination of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Planet');
    }
  },
  'turns_remaining': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('turns until arrival of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Number');
    }
  },
  'distance': {
    init: function() {
      this.setInputsInline(true);
      this.appendValueInput('PLANET1')
        .appendField('distance between')
        .setCheck('Planet');
      this.appendValueInput('PLANET2')
        .appendField('and')
        .setCheck('Planet');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Number');
    }
  },
  'dispatch': {
    init: function() {
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      
      this.appendDummyInput()
        .appendField('Dispatch')
        .setAlign(Blockly.ALIGN_RIGHT);
      
      this.appendValueInput('SHIP_COUNT')
        .appendField('ships')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT);
      this.appendValueInput('SOURCE_PLANET')
        .appendField('from')
        .setCheck('Planet')
        .setAlign(Blockly.ALIGN_RIGHT);
      this.appendValueInput('TARGET_PLANET')
        .appendField('to')
        .setCheck('Planet')
        .setAlign(Blockly.ALIGN_RIGHT);
      this.setColour(FN_COLOUR);
    }
  }
};
