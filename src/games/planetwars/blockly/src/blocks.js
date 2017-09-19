var Blockly = require("node-blockly/browser");

const PW_COLOUR = 275;
const FN_COLOUR = 180;
const LIST_COLOUR = 225;

const planetwars = {
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
  'player_me': {
    init: function() {
      this.appendDummyInput().appendField('Me');
      this.setColour(PW_COLOUR);
      this.setOutput(true, 'Player');
    }
  },
  'player_nobody': {
    init: function() {
      this.appendDummyInput().appendField('Nobody');
      this.setColour(PW_COLOUR);
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
      this.setColour(LIST_COLOUR);
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
      this.setColour(LIST_COLOUR);
      this.setOutput(true);
    }
  }
};

module.exports = {
  planetwars: planetwars,
  functions: functions,
  'lists': lists
};
