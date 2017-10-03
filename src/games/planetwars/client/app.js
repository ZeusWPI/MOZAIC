const Blockly = require('planetwars-blockly');
const Visualizer = require('planetwars-visualizer');

const React = require('react');
const ReactDOM = require('react-dom');
const h = require('react-hyperscript');
const {
  button,
  div,
  figure,
  h1,
  header,
  input,
  label,
  select,
  img,
  span,
  ul,
  li
} = require('hyperscript-helpers')(h);

const FileSaver = require('file-saver');

const BLOCKLY_STATE = 'BLOCKLY';
const VISUALIZER_STATE = 'VISUALIZER';


// TODO: move to some helpers module
function fa_icon(name) {
  return h('i.fa.fa-' + name, { 'aria-hidden': true});
}

class MenuBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return header([
      figure('.logo', [
        img({ src: 'res/logo.png', alt: 'MOZAIC' })
      ]),
      div('.uname-form', [
        input('#uname', {type: 'text', value: 'bert'}),
        label('Username')
      ]),
      div('.enemy-form', [
        select('#enemy'),
        label('Enemy')
      ]),
      ul('.header-toolbar', [
        li([
          button('#load', [fa_icon('upload')]),
          input('#file-input', { type: 'file', name: 'name', style: {display: 'none'} })
        ]),
        li([
          button('#save', [fa_icon('floppy-o')])
        ]),
        li([
          button('#switch_view_state', [fa_icon('play')])
        ])
      ])
    ]);
  }
  
}

class PlanetwarsClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.submitCallback = this.codeSubmittedHandler.bind(this);

    // controls
    
    //this.fab.addEventListener('click', e => this.fabHandler(e));

    this.switch_view_state = document.getElementById('switch_view_state');
    this.switch_view_state.addEventListener('click', e => this.switch_view_stateHandler(e));
    this.save_btn = document.getElementById('save');
    this.save_btn.addEventListener('click', e => this.saveHandler(e));
    this.load_btn = document.getElementById('load');
    this.load_btn.addEventListener('click', e => this.loadHandler(e));

    this.name_field = document.getElementById('uname');
    this.user_name = this.name_field.value;
    //this.user_name.addEventListener('change', e => this.user_name = this.name_field.value);

    this.blockly_div = document.getElementById('blockly');
    this.visualizer_div = document.getElementById('visualizer');
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
      //this.fab.innerHTML = fa_icon('play');
    } else if (mode == VISUALIZER_STATE) {
      //this.fab.innerHTML = fa_icon('code');
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

  saveHandler(e) {
    console.log("SAVE");
    var xml = this.blockly.getXml();
    var file = new File([xml], "bot.xml", {type: "text/xml;charset=utf-8"});
    FileSaver.saveAs(file);
  }

  loadHandler(e) {
    console.log("LOAD");
    var fileSelect = document.getElementById('file-input');
    fileSelect.click();
    fileSelect.onchange = () => {
        var reader = new FileReader();
        reader.onload = (event) => {
          this.blockly.clear();
          var xml = event.target.result;
          this.blockly.loadXml(xml);
        };
      reader.readAsText(fileSelect.files[0]);
    };
  }    
  
  switch_view_stateHandler(e) {
    if (this.state == BLOCKLY_STATE) {
      this.submitCode(res => {
        // visualize game
        this.visualizer.visualize(res);
        this.setState(VISUALIZER_STATE);
        this.visualizer.play();
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
    return h(MenuBar);
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
      "name": this.user_name
    });
    xmlhttp.send(request);
  }
}


window.onload = function() {
  ReactDOM.render(
    h(PlanetwarsClient),
    document.getElementById('root')
  );
};
