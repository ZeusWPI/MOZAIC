const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');

const BLOCKLY_STATE = 'BLOCKLY';
const VISUALIZER_STATE = 'VISUALIZER';

class PlanetwarsClient {
  constructor(name) {
    this.blockly = Blockly.inject('blockly');
    this.name = name;
    this.visualizer = new Visualizer();

    // TODO: put this somewhere else
    // TODO: please don't do this every save
    this.blockly.addChangeListener(e => {
      window.localStorage.setItem('blocklyCode', this.blockly.getXml());
    });

    let xml = window.localStorage.getItem('blocklyCode');
    if (xml) {
      this.blockly.loadXml(xml);
    }

    // controls
    this.save_btn = document.getElementById('save');
    this.save_btn.addEventListener('click', e => this.saveHandler(e));
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
      this.fab.innerHTML = fa_icon('play');
    } else if (state == VISUALIZER_STATE) {
      this.blockly_div.classList.add('invisible');
      this.visualizer_div.classList.remove('invisible');
      this.fab.innerHTML = fa_icon('code');
    }
  }

  saveHandler(e) {
    console.log("SAVE");
  }

  fabHandler(e) {
    if (this.state == BLOCKLY_STATE) {
      this.submitCode(res => {
        // visualize game
        this.visualizer.visualize(res);
        this.setState(VISUALIZER_STATE);
        this.visualizer.play();
      });
    } else if (this.state == VISUALIZER_STATE) {
      this.setState(BLOCKLY_STATE);
      window.dispatchEvent(new Event('resize'));
      this.visualizer.pause();
    }
  }

  submitCode(callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", 'bot');
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE) {
        if (xmlhttp.status == 200) {
          callback(xmlhttp.responseText);
        } else {
          console.log(xmlhttp);
          alert(`ERROR ERROR ${xmlhttp.status} ${xmlhttp.responseText}`);
        }
      }
    };

    console.log(this.blockly.getCode());

    var request = JSON.stringify({
      "code": this.blockly.getCode(),
      "name": this.name
    });
    xmlhttp.send(request);
  }

}

function fa_icon(name) {
  return '<i class="fa fa-' + name + '" aria-hidden="true"></i>';
}

window.onload = function() {
  // var prompt = "What is your name? Don't be bert and don't use special characters, like bert, he's special.";
  // var def = "sadeerstejaar";
  // var name = window.prompt(prompt, def);

  new PlanetwarsClient(name);
};
