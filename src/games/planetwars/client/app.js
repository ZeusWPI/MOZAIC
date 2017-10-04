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

  handleNameChange(event) {
    this.setState({ userName: event.target.value });
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
        input('#uname', {
          type: 'text',
          onChange: this.props.onNameChange,
          value: this.props.userName
        }),
        label('Username')
      ]),
      div('.enemy-form', [
        select('#enemy'),
        label('Enemy')
      ]),
      ul('.header-toolbar', [
        li([
          button(
            '#load',
            { onClick: this.props.loadHandler },
            [fa_icon('upload')]
          ),
          input('#file-input', { type: 'file', name: 'name', style: {display: 'none'} })
        ]),
        li([
          button(
            '#save',
            { onClick: this.props.saveHandler },
            [fa_icon('floppy-o')]
          )
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
    this.state = {
      userName: 'RoboBert',
      viewState: VIEW_STATE_BLOCKLY
    };
  }

  setViewState(viewState) {
    this.setState({ 'viewState': viewState });
  }

  setLog(log) {
    this.setState({ 'log': log });
  }

  handleNameChange(event) {
    this.setState({'userName': event.target.value });
  }

  fabHandler(e) {
    if (this.state.viewState == VIEW_STATE_BLOCKLY) {
      this.submitCode(log => {
        this.setLog(log);
        this.setViewState(VIEW_STATE_VISUALIZER);
      });
    } else if (this.state.viewState == VIEW_STATE_VISUALIZER ) {
      this.setViewState(VIEW_STATE_BLOCKLY);
      // TODO: maybe move this
      window.dispatchEvent(new Event('resize'));
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

  // TODO: clean this up, maybe use a library for this request
  submitCode(callback) {
    console.log(this.blockly.getCode());
    
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

    xmlhttp.send(JSON.stringify({
      "code": this.blockly.getCode(),
      "name": this.state.userName
    }));
  }

  view() {
    if (this.state.viewState == VIEW_STATE_BLOCKLY) {
      return h(BlocklyComponent, {
        ref: (blockly) => { this.blockly = blockly; }
      });
    } else {
      return h(Visualizer, {
        'log': this.state.log
      });
    }
  }

  render() {
    return div('#box', [
      h(MenuBar, {
        viewState: this.state.viewState,
        userName: this.state.userName,
        switchViewHandler: e => this.fabHandler(e),
        saveHandler: e => this.saveHandler(e),
        loadHandler: e => this.loadHandler(e),
        onNameChange: e => this.handleNameChange(e)
      }),
      this.view()
    ]);
  }
}

// TODO only here for prototype
// TODO: move to actual blockly package
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

  getCode() {
    return this.blockly.getCode();
  }

  getXml() {
    return this.blockly.getXml();
  }

  render() {
    return div('#blockly');
  }
}


window.onload = function() {
  ReactDOM.render(
    h(PlanetwarsClient),
    document.getElementById('root')
  );
};
