const d3 = require('d3');
const React = require('react');
const h = require('react-hyperscript');
const {
  div,
  span,
  h1,
  button,
  i,
  input,
  p,
  svg
} = require('hyperscript-helpers')(h);

const Visuals = require('./visuals');
const Controls = require('./controls');
const Game = require('./game');
const Utils = require('./util');
const ReactUtils = require('./react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ControlButton = ReactUtils.ControlButton;

class Visualizer extends React.Component {

  constructor(props) {
    super(props);
    this.model = new Game();
    this.state = {
      hide_card: true
    };

    // Speed property is already updated, resetting timer will use new speed
    this.model.speed_binder.registerCallback(s => {
      if (this.model.run_binder.value) {
        this._stopTimer();
        this._startTimer();
      }
    });

    this.model.turn_binder.registerCallback(v => {
      this.running = this._showTurn(v);
    });

    this.model.run_binder.registerCallback(v => {
      if (v) {
        this._startTimer();
      } else {
        this._stopTimer();
      }
    });
  }

  visualize(log) {
    this.clear();
    this.model.init(log);
    this.visuals.init(this.model);
    this.model.reset();
  }

  clear() {
    this.visuals.clearVisuals();
  }

  play() {
    this.model.run_binder.update(true);
  }

  pause() {
    this.model.run_binder.update(false);
  }

  nextTurn() {
    this.model.turn_binder.update((this.model.turn_binder.value) + 1);
  }

  previousTurn() {
    this.model.turn_binder.update((this.model.turn_binder.value) - 1);
  }

  _showTurn(newTurn) {
    if (newTurn >= this.model.maxTurns) {
      this.model.run_binder.update(false);
    } else {
      var turn = this.model.turns[newTurn];
      this.visuals.update(turn, this.model.speed_binder.value);
    }
  }

  _startTimer() {
    var callback = elapsed => {
      this.nextTurn();
    };
    this.turn_timer = d3.interval(callback, this.model.speed_binder.value);

  }

  _stopTimer() {
    if (this.turn_timer) {
      this.turn_timer.stop();
    }
  }

  componentDidUpdate() {
    if (this.props.log != 'undefined') {
      this.visualize(this.props.log);
    }
    if (this.props.isVisualizing) {
      this.play();
    } else {
      this.pause();
    }
  }

  render() {
    return (
      div('#visualizer-root-node', [
        h(Scoreboard),
        h(Controls, {
          'model': this.model
        }),
        svg('#game'),
        h(HideableComponent, {
          hide: this.state.hide_card,
          render: div('#end_card', [
            h(ControlButton, {
              selector: '#hide_card.close',
              title: 'Hide end card',
              icon: 'times',
              callback: () => this.setState({
                hide_card: true
              })
            }),
            p(['Game over', h('br'), span('#winner', 'winner'), ' wins!'])
          ])
        })
      ])
    );
  }

  componentDidMount() {
    this.visuals = new Visuals();
  }
}

class Scoreboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hide: false
    };
  }

  render() {
    return div('#scoreboard_wrapper', [
      svg(`#score${this.state.hide?'.invisible':''}`),
      h(HideableComponent, {
        'hide': this.state.hide,
        render: h(ControlButton, {
          selector: '#hide_score.close',
          title: 'Hide scoreboard',
          icon: 'times',
          callback: () => this.setState({
            hide: true
          })
        })
      }),
      h(HideableComponent, {
        hide: !this.state.hide,
        render: h(ControlButton, {
          selector: '#unhide_score',
          title: 'Show scoreboard',
          icon: 'chevron-left',
          callback: () => this.setState({
            hide: false
          })
        })
      })
    ]);
  }
}

function createButton(selector, title, icon) {
  return button(`${selector}.control.control-button`, {
    'title': title,
    'type': 'button',
    'aria-hidden': 'true'
  }, [
    i(`.fa.fa-${icon}`)
  ])
}
module.exports = Visualizer;
