const d3 = require('d3');
const Config = require('./util/config');
const uuidv4 = require('uuid/v4')
const React = require('react');
const h = require('react-hyperscript');
const {
  div,
  button,
  i,
  input,
  p
} = require('hyperscript-helpers')(h);

const ReactUtils = require('./util/react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ToggleButton = ReactUtils.ToggleButton;
const ControlButton = ReactUtils.ControlButton;

function fa_icon(name) {
  return h('i.fa.fa-' + name, {
    'aria-hidden': true
  });
}

// TODO: maybe extract button functionality in helper functions
class Controls extends React.Component {

  playButton() {
    if (this.props.playing) {
      return button(
        '.button', {
          title: 'Pause',
          onClick: e => this.props.setPlaying(false)
        }, [fa_icon('pause')]
      );
    } else {
      return button(
        '.button', {
          title: 'Play',
          onClick: e => this.props.setPlaying(true)
        }, [fa_icon('play')]
      );
    }
  }

  render() {
    return div('#control-bar', [
      input({
        type: 'range',
        id: 'turn-slider',
        value: this.props.turnNum,
        className: 'control',
        max: this.props.numTurns,
        onChange: e => this.props.setTurn(+e.target.value)
      }),
      div('#control-buttons', [
        div('#turn-controls', [
          button(
            '.button', {
              title: 'Go to first turn',
              onClick: e => this.props.setTurn(0)
            }, [fa_icon('fast-backward')]
          ),
          button(
            '.button', {
              title: 'Go to previous turn',
              onClick: e => this.props.setTurn(this.props.turnNum - 1)
            }, [fa_icon('step-backward')]
          ),
          this.playButton(),
          button(
            '.button', {
              title: 'Go to next turn',
              onClick: e => this.props.setTurn(this.props.turnNum + 1)
            }, [fa_icon('step-forward')]
          ),
          button(
            '.button', {
              title: 'Go to last turn',
              onClick: e => this.props.setTurn(this.props.numTurns - 1)
            }, [fa_icon('fast-forward')]
          ),
          p('#turn-progress', `${this.props.turnNum} / ${this.props.numTurns}`)
        ]),
        div('#file-controls', [
          h(LogLoaderButton, {
            handleContents: this.props.setLog
          })
        ]),
        div('#speed-controls', [
          p('.speed', `Speed x${this.props.speed}`),
          button(
            '.button', {
              title: 'Decrease speed',
              onClick: e => this.props.setSpeed(this.props.speed / 2)
            }, [fa_icon('minus')]
          ),
          button(
            '.button', {
              title: 'Increase speed',
              onClick: e => this.props.setSpeed(this.props.speed * 2)
            }, [fa_icon('plus')]
          )
        ])
      ]),
    ]);
  }
}


class LogLoaderButton extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      elementId: this.props.elementId || uuidv4()
    }

    this.hide = {
      width: '0px',
      opacity: '0',
      position: 'fixed',
    }

    // WTF React
    this.handleFile = this.handleFile.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  handleFile(clickEvent) {
    var reader = new FileReader();
    reader.onload = (readEvent) => {
      var log = readEvent.target.result;
      this.props.handleContents(log);
    }
    reader.readAsText(clickEvent.target.files[0]);
  }

  onClick() {
    let element = document.getElementById(this.state.elementId);
    element.value = '';
    element.click();
  }

  render(){
    return div("#log-reader", [
      input({
        id: this.state.elementId,
        type: 'file',
        style: this.hide,
        onChange: this.handleFile
      }),
      input({
        type: 'button',
        value: 'Load game',
        onClick: this.onClick
      })
    ])
  }
}

module.exports = Controls;