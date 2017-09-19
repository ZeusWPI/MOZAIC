var Blockly = require("node-blockly/browser");

const CONSTANT_COLOR = 275;
const ATTRIBUTE_COLOR = 180;
const LIST_COLOR = 225;

const planetwars = {
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

const functions = {
  'fn_owner': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('owner of');
      this.setColour(ATTRIBUTE_COLOR);
      this.setOutput(true, 'Player');
    }
  },
  'fn_ship_count': {
    init: function() {
      this.appendValueInput('OBJ')
        .setCheck(['Planet', 'Expedition'])
        .appendField('fleet size of');
      this.setColour(ATTRIBUTE_COLOR);
      this.setOutput(true, 'Number');
    }
  }
};

const lists = {
  'list_filter': {
    init: function() {
      this.appendValueInput('LIST')
        .appendField('all')
        .appendField(new Blockly.FieldVariable('element'), 'ELEM_NAME')
        .appendField('in')
        .setCheck('List');
      this.appendValueInput('PREDICATE')
        .appendField('where')
        .setCheck('Boolean');
      this.setColour(LIST_COLOR);
      this.setOutput(true, 'List');
    }
  },
  'list_minmax': {
    init: function() {
      const modes = [['minimizes', 'MINIMIZE'],
                     ['maximizes', 'MAXIMIZE']];
      this.appendValueInput('LIST')
        .appendField(new Blockly.FieldVariable('element'), 'ELEM_NAME')
        .appendField('in')

        .setCheck('List');
      this.appendValueInput('EXPR')
        .appendField('that')
        .appendField(new Blockly.FieldDropdown(modes), 'MODE')
        .setCheck('Number');
      this.setColour(LIST_COLOR);
      this.setOutput(true);
    }
  }
};

module.exports = {
  planetwars: planetwars,
  functions: functions,
  'lists': lists
};
