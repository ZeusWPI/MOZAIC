const d3 = require('d3');
const Config = require('./config');
const Utils = require('./util');
const space_math = Utils.SpaceMath;
const React = require('react');
const h = require('react-hyperscript');
const {
  div,
  button,
  i,
  input,
  p
} = require('hyperscript-helpers')(h);

const ReactUtils = require('./react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ToggleButton = ReactUtils.ToggleButton;
const ControlButton = ReactUtils.ControlButton;

function fa_icon(name) {
  return h('i.fa.fa-' + name, { 'aria-hidden': true});
}

class Controls extends React.Component {
  render() {
    return div('#controlbar', [
      input({
        type: 'range',
        id: 'turn_slider',
        value: this.props.turnNum,
        className: 'control',
        max: this.props.numTurns,
        onChange: e => this.props.setTurn(+e.target.value)
      }),
      div('.turncontrols', [
        button(
          '.control.control-button',
          {
            title: 'Go to first turn',
            onClick: e => this.props.setTurn(0)
          },
          [ fa_icon('fast-backward') ]
        ),
        button(
          '.control.control-button',
          {
            title: 'Go to previous turn',
            onClick: e => this.props.setTurn(this.props.turnNum - 1)
          },
          [ fa_icon('step-backward') ]
        ),
        h(ToggleButton, {
          selector: '#pause',
          title1: 'Pause game',
          title2: 'Play game',
          icon1: 'pause',
          icon2: 'play',
          toggle: false
        }),
        button(
          '.control.control-button',
          {
            title: 'Go to next turn',
            onClick: e => this.props.setTurn(this.props.turnNum + 1)
          },
          [ fa_icon('step-forward') ]
        ),
        button(
          '.control.control-button',
          {
            title: 'Go to last turn',
            onClick: e => this.props.setTurn(this.props.numTurns - 1)
          },
          [ fa_icon('fast-forward') ]
        ),
        p('#turn_progress', `${this.props.turnNum} / ${this.props.numTurns}`)
      ]),
      div('.speedcontrols', [
        p('.speed', `Speed x${this.props.speed}`),
        h(ControlButton, {
          selector: '#speed_down',
          title: 'Lower speed',
          icon: 'minus'
        }),
        h(ControlButton, {
          selector: '#speed_up',
          title: 'Increase speed',
          icon: 'plus'
        })
      ])
    ]);
  }
}

module.exports = Controls;
