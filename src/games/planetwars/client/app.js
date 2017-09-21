const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');

const BLOCKLY_STATE = 'BLOCKLY';
const VISUALIZER_STATE = 'VISUALIZER';

class PlanetwarsClient {
  constructor() {
    this.blockly = Blockly.inject('blockly');
    this.visualizer = new Visualizer();

    // controls
    this.fab = document.getElementById('fab');
    this.fab.addEventListener('click', e => this.fabHandler(e));
    this.blockly_div = document.getElementById('blockly');
    this.visualizer_div = document.getElementById('visualizer');

    // initial state
    this.setState(BLOCKLY_STATE);

  }

  setState(state) {
    this.state = state;
    if (state == BLOCKLY_STATE) {
      this.blockly_div.classList.remove('invisible');
      this.visualizer_div.classList.add('invisible');
    } else if (state == VISUALIZER_STATE) {
      this.blockly_div.classList.add('invisible');
      this.visualizer_div.classList.remove('invisible');
    }
  }

  fabHandler(e) {
    if (this.state == BLOCKLY_STATE) {
      this.setState(VISUALIZER_STATE);
    } else if (this.state == VISUALIZER_STATE) {
      this.setState(BLOCKLY_STATE);
    }
  }
}

window.onload = function() {
  new PlanetwarsClient();
};
