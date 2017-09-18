var Blockly = require("node-blockly/browser");

window.onload = function() {
  console.log("ok");
  var workspaceplayground = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox')
  });
};
