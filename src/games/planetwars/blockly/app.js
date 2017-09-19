var Blockly = require("node-blockly/browser");
const blocks = require("./src/blocks");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;

// Register all blocks
Object.entries(blocks).forEach(([name, block]) => {
  Blockly.Blocks[name] = block;
});

// Bulid toolbox xml
var toolbox = "<xml>";
Object.keys(blocks).forEach(name => {
  toolbox += "<block type=\"" + name + "\"></block>";
});
toolbox += "</xml>";

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', { toolbox: toolbox });
  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
