const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');
const React = require('react');
const ReactDOM = require('react-dom');
const h = require('react-hyperscript');
const {
  div,
  span,
  h1
} = require('hyperscript-helpers')(h);

const BLOCKLY_STATE = 'BLOCKLY';
const VISUALIZER_STATE = 'VISUALIZER';

class PlanetwarsClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.submitCallback = this.codeSubmittedHandler.bind(this);




    // controls
    this.fab = document.getElementById('fab');
    this.fab.addEventListener('click', e => this.fabHandler(e));

  }

  componentDidMount() {
    // initial state
    this.setMode(BLOCKLY_STATE);
  }

  setMode(mode) {
    this.setState({
      'mode': mode
    });
    if (mode == BLOCKLY_STATE) {
      this.fab.innerHTML = fa_icon('play');
    } else if (mode == VISUALIZER_STATE) {
      this.fab.innerHTML = fa_icon('code');
    }
  }

  fabHandler(e) {
    if (this.state.mode == BLOCKLY_STATE) {
      this.setState({
        shouldSubmit: true,
        isVisualizing: true
      });
    } else if (this.state.mode == VISUALIZER_STATE) {
      this.setMode(BLOCKLY_STATE);
      window.dispatchEvent(new Event('resize'));
      this.setState({
        isVisualizing: false
      });
    }
  }

  codeSubmittedHandler(res) {
    this.state.shouldSubmit = false;
    this.setMode(VISUALIZER_STATE);
    this.setState({
      log: res
    });
  }

  render() {
    if (this.state.mode == VISUALIZER_STATE) {
      return React.createElement(Visualizer, {
        log: this.state.log,
        isVisualizing: this.state.isVisualizing
      });
    } else {
      return React.createElement(BlocklyComponent, {
        shouldSubmit: this.state.shouldSubmit,
        submitCallback: this.submitCallback
      });
    }
  }
}

//TODO only here for prototype
class BlocklyComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.blockly = Blockly.inject('blockly');
    // TODO: put this somewhere else
    // TODO: please don't do this every save
    this.blockly.addChangeListener(e => {
      window.localStorage.setItem('blocklyCode', this.blockly.getXml());
    });

    let xml = window.localStorage.getItem('blocklyCode');
    if (xml) {
      this.blockly.loadXml(xml);
    }
  }

  componentDidUpdate() {
    if (this.props.shouldSubmit) {
      this.submitCode(this.props.submitCallback);
    }
  }

  render() {
    return div('#blockly');
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
  var prompt = "What is your name? Don't be bert and don't use special characters, like bert, he's special.";
  var def = "sadeerstejaar";
  var name = window.prompt(prompt, def);

  ReactDOM.render(
    h(PlanetwarsClient, {
      'name': name
    }),
    document.getElementById("box")
  );
};
