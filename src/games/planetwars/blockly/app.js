var Blockly = require("node-blockly/browser");
const blocks = require("./src/blocks");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;


var toolbox = {};


// Register all custom blocks
Object.entries(blocks).forEach(([cat_name, cat_blocks]) => {
  var list = [];
  Object.entries(cat_blocks).forEach(([block_name, block]) => {
    Blockly.Blocks[block_name] = block;
    list.push(block_name);
  });
  toolbox[cat_name] = list;
});

// Add builtins to toolbox
toolbox['logic'] = [
  'logic_boolean',
  'logic_compare',
  'logic_null',
  'logic_operation',
  'logic_ternary'
];

toolbox['variables'] = [
  'variables_set',
  'variables_get'
];

toolbox['math'] = [
  'math_arithmetic',
  'math_change',
  'math_constant',
  'math_constrain',
  'math_modulo',
  'math_number',
  'math_number_property',
  'math_on_list',
  'math_random_float',
  'math_random_int',
  'math_round',
  'math_single',
  'math_trig'
];

// Bulid toolbox xml
var toolbox_str = '<xml>';
Object.entries(toolbox).forEach(([cat_name, cat_entries]) => {
  toolbox_str += '<category name="' + cat_name + '">';
  cat_entries.forEach(block_name => {
    toolbox_str += '<block type="' + block_name + '"></block>';
  });
  toolbox_str += '</category>';
});
toolbox_str += '</xml>';

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', { toolbox: toolbox_str });
  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
