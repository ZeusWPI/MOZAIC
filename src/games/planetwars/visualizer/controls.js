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

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hideBar: false,
      turn: 0,
      running: false,
      mod: 3
    };
    return;
    this.props.model.turn_binder.registerCallback(t => {
      this.setState({
        turn: this.props.model.turn_binder.value
      });
    });
    this.props.model.run_binder.registerCallback(t => {
      this.setState({
        running: this.props.model.run_binder.value
      });
    });
  }

  render() {
    return div('#controls', [
      h(ToggleButton, {
        selector: '#hide',
        title1: 'Hide Controls',
        title2: 'Show Controls',
        icon1: 'chevron-down',
        icon2: 'chevron-up',
        callback1: () => this.setState({
          hideBar: true
        }),
        callback2: () => this.setState({
          hideBar: false
        })
      }),
      h(HideableComponent, {
        hide: this.state.hideBar,
        render: div('#controlbar', [
          input({
            type: 'range',
            id: 'turn_slider',
            value: this.state.turn,
            className: 'control',
            max: this.props.maxTurns
            //onChange: e => this.props.model.turn_binder.update(+e.target.value)
          }),
          div('.turncontrols', [
            h(ControlButton, {
              selector: '#to_start',
              title: 'Go to start of the game',
              icon: 'fast-backward'
              // callback: () => {
              //   this.props.model.turn_binder.update(0);
              //   this.props.model.run_binder.update(false);
              // }
            }),
            h(ControlButton, {
              selector: '#previous',
              title: 'Go back one turn',
              icon: 'step-backward'
              // callback: () => {
              //   this.props.model.turn_binder.update(this.props.model.turn_binder.value - 1);
              // }
            }),
            h(ToggleButton, {
              selector: '#pause',
              title1: 'Pause game',
              title2: 'Play game',
              icon1: 'pause',
              icon2: 'play',
              toggle: false
              // callback1: () => this.props.model.run_binder.update(true),
              // callback2: () => this.props.model.run_binder.update(false)
            }),
            h(ControlButton, {
              selector: '#next',
              title: 'Go forward one turn',
              icon: 'step-forward'
              // callback: () => {
              //   this.props.model.turn_binder.update(this.props.model.turn_binder.value + 1);
              // }
            }),
            h(ControlButton, {
              selector: '#to_end',
              title: 'Go to end of the game',
              icon: 'fast-forward'
              // callback: () => {
              //   this.props.model.turn_binder.update(this.props.model.maxTurns);
              //   this.props.model.run_binder.update(false);
              // }
            }),
            p('#turn_progress', `${this.props.turnNum} / ${this.props.numTurns}`)
          ]),
          div('.speedcontrols', [
            p('.speed', `Speed x${Config.speed_mods[this.state.mod]}`),
            h(ControlButton, {
              selector: '#speed_down',
              title: 'Lower speed',
              icon: 'minus'
              // callback: () => {
              //   if (this.state.mod > 0) {
              //     this.setState({
              //       mod: this.state.mod - 1
              //     });
              //     this.props.model.speed_binder.update(Config.base_speed / Config.speed_mods[this.state.mod]);
              //   }
              //}
            }),
            h(ControlButton, {
              selector: '#speed_up',
              title: 'Increase speed',
              icon: 'plus'
              // callback: () => {
              //   if (this.state.mod < Config.speed_mods.length - 1) {
              //     this.setState({
              //       mod: this.state.mod + 1
              //     });
              //     this.props.model.speed_binder.update(Config.base_speed / Config.speed_mods[this.state.mod]);
              //   }
              //}
            })
          ])
        ])
      })
    ]);
  }
}

module.exports = Controls;
