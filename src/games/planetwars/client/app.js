const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');

class PlanetwarsClient {
  constructor(blockly, visualizer) {
    this.blockly = blockly;
    this.visualizer = visualizer;
  }
}

window.onload = function() {
  Blockly.inject('blockly');
};
