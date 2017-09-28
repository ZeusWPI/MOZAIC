var Blockly = require("node-blockly/browser");
const Blocks = require("./src/blocks");
const PlanetWars = require("./src/planetwars");


// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.6;
Blockly.Blocks.variables.HUE = 33;
Blockly.Msg.VARIABLES_HUE = 33;
Blockly.Blocks.logic.HUE = 183;
Blockly.Msg.LOGIC_HUE = 183;
Blockly.Blocks.math.HUE = 213;
Blockly.Msg.MATH_HUE = 213;
Blockly.Blocks.lists.HUE = 333;
Blockly.Msg.LISTS_HUE = 333;
Blocks.inject(Blockly);

const toolbox = {
  'entities': [
    'entities_planets',
    'entities_expeditions',
    'entities_players',
    'entities_player',
    'entities_nobody'
  ],
  'functions': [
    'functions_owner',
    'functions_ship_count',
    'functions_origin',
    'functions_target',
    'functions_turns_remaining',
    'functions_distance',
    'functions_dispatch'
  ],
  'lists': [
    'lists_isEmpty',
    'lists_length',
    'lists_filter',
    'lists_minmax',
    'lists_forEach',
    'lists_sort'
  ],
  'logic': [
    'logic_boolean',
    'logic_compare',
    'logic_null',
    'logic_operation',
    'logic_ternary',
    'controls_if'

  ],
  'variables': [
    'variables_set',
    'variables_get',
    'math_change',

  ],
  'math': [
    'math_arithmetic',
    'math_constant',
    'math_constrain',
    'math_modulo',
    'math_number',
    'math_number_property',
    'math_on_list',
    'math_random_int',
    'math_round',
    'math_single'
  ]
};

// construct toolbox xml
function toolbox_xml(toolbox) {
  var toolbox_str = '<xml>';
  Object.entries(toolbox).forEach(([cat_name, cat_entries]) => {
    let colour = Blockly.Blocks[cat_name].HUE;
    toolbox_str += `<category name="${cat_name}" colour="${colour}">`;
    cat_entries.forEach(block_name => {
      toolbox_str += `<block type="${block_name}"></block>`;
    });
    toolbox_str += '</category>';
  });
  toolbox_str += '</xml>';
  return toolbox_str;
}

function inject(div_id) {
  var tb = toolbox_xml(toolbox);
  var workspace = Blockly.inject(div_id, { toolbox: tb });
  return new PlanetWarsBlockly(workspace);
}

console.log(Blockly.Blocks);

class PlanetWarsBlockly {
  constructor(workspace) {
    this.workspace = workspace;
  }

  getCode() {
    return Blockly.JavaScript.workspaceToCode(this.workspace);
  }

  getXml() {
    var xml = Blockly.Xml.workspaceToDom(this.workspace);
    var xml_text = Blockly.Xml.domToText(xml);
    return xml_text;
  }

  loadXml(xml_text) {
    var xml = Blockly.Xml.textToDom(xml_text);
    Blockly.Xml.domToWorkspace(xml, this.workspace);
  }

  addChangeListener(fun) {
    this.workspace.addChangeListener(fun);
  }

};

module.exports = {
  inject
};
