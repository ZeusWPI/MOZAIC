const Blockly = require('planetwars-blockly');
const Controls = require('planetwars-visualizer/controls');

class PlanetwarsClient {
  constructor(blockly, visualizer) {
    this.blockly = blockly;
    this.visualizer = visualizer;
  }
}

window.onload = function() {
  Blockly.inject('blockly');
  new Controls();
};
