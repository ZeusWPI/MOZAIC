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

// view states
const VIEW_STATE_BLOCKLY = 'BLOCKLY';
const VIEW_STATE_VISUALIZER = 'VISUALIZER';


// TODO: move to some helpers module
function fa_icon(name) {
  return h('i.fa.fa-' + name, { 'aria-hidden': true});
}

class MenuBar extends React.Component {
  constructor(props) {
    super(props);
  }

  view_state_button_icon() {
    if (this.props.viewState == VIEW_STATE_BLOCKLY) {
      return fa_icon('play');
    } else {
      return fa_icon('code');
    }
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
          button(
            '#switch_view_state',
            { onClick:  this.props.switchViewHandler },
            [ this.view_state_button_icon() ]
          )
        ])
      ])
    ]);
  }
  
}

class PlanetwarsClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = { viewState: VIEW_STATE_BLOCKLY };
    this.submitCallback = this.codeSubmittedHandler.bind(this);
  }

  setViewState(viewState) {
    this.setState({
      'viewState': viewState
    });
  }

  fabHandler(e) {
    if (this.state.viewState == VIEW_STATE_BLOCKLY) {
      // TODO
      // this.submitCode();
      this.setViewState(VIEW_STATE_VISUALIZER);
    } else if (this.state.viewState == VIEW_STATE_VISUALIZER ) {
      this.setViewState(VIEW_STATE_BLOCKLY);
      // TODO: maybe move this
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

  // TODO: get rid of this
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
    return h(MenuBar, {
      viewState: this.state.viewState,
      switchViewHandler: e => this.fabHandler(e)
    });
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
