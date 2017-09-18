var Blockly = require("node-blockly/browser");

Blockly.Blocks['planets'] = {
  init: function() {
    this.appendDummyInput().appendField('Planets');
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
