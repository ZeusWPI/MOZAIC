var Blockly = require("node-blockly/browser");

const FN_COLOUR = 180;

module.exports = {
  'fn_owner': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('owner of');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Player');
    }
  },
  'fn_ship_count': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('fleet size of');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Number');
    }
  },
  'fn_origin': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('origin of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Planet');
    }
  },
  'fn_target': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('destination of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Planet');
    }
  },
  'fn_turns_remaining': {
    init: function() {
      this.appendValueInput('EXPEDITION')
        .appendField('turns until arrival of')
        .setCheck('Expedition');
      this.setColour(FN_COLOUR);
      this.setOutput(true, 'Number');
    }
  },
  'fn_distance': {
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
  'fn_dispatch': {
    init: function() {
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.appendValueInput('SHIP_COUNT')
        .appendField('Dispatch')
        .setCheck('Number');
      this.appendValueInput('SOURCE_PLANET')
        .appendField('ships from')
        .setCheck('Planet');
      this.appendValueInput('TARGET_PLANET')
        .appendField('to')
        .setCheck('Planet');
      this.setColour(FN_COLOUR);
    }
  }
};
