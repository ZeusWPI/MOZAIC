var Blockly = require("node-blockly/browser");
const blocks = require("./src/blocks");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;

// Register all blocks
Object.values(blocks).forEach(cat => {
  Object.entries(cat).forEach(([block_name, block]) => {
    Blockly.Blocks[block_name] = block;
  });
});

// Bulid toolbox xml
var toolbox = '<xml>';
Object.entries(blocks).forEach(([cat_name, cat]) => {
  toolbox += '<category name="' + cat_name + '">';
  Object.keys(cat).forEach(block_name => {
    toolbox += '<block type="' + block_name + '"></block>';
  });
  toolbox += '</category>';
});
toolbox += '</xml>';

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', { toolbox: toolbox });
  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
