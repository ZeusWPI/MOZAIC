var Blockly = require("node-blockly/browser");
require("./src/blocks");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
  });

  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
