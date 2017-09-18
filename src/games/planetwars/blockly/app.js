var Blockly = require("node-blockly/browser");

// happier colours
Blockly.HSV_SATURATION = 0.6;
Blockly.HSV_VALUE = 0.8;


Blockly.Blocks['planets'] = {
  init: function() {
    this.appendDummyInput().appendField('Planets');
    this.setColour(275);
    this.setOutput(true, 'List');
  }
};

window.onload = function() {
  var workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
  });

  workspace.addChangeListener(function() {
    var code = Blockly.JavaScript.workspaceToCode(workspace);
    document.getElementById('generatedCodeDiv').innerHTML = code;
  });
};
