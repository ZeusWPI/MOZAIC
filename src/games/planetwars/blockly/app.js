var Blockly = require("node-blockly/browser");
const blocks = require("./src/blocks");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;

Object.entries(blocks).forEach(([name, block]) => {
  Blockly.Blocks[name] = block;
});

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
  });

  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
