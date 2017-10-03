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

class Visualizer extends React.Component {

  constructor(props) {
    super(props);
    this.model = new Game();

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
    //this.controls.attachEvents(this.model);
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
        svg('#score'),
        createButton('#hide_score.close', 'Hide scoreboard', 'times'),
        createButton('#unhide_score', 'Show scoreboard', 'chevron-left'),
        h(Controls, {
          'model': this.model
        }),
        svg('#game'),
        div('#end_card', [
          createButton('#hide_card.close', 'Hide end card', 'times'),
          p(['Game over', h('br'), span('#winner', 'winner'), ' wins!'])
        ])
      ])
    );
  }

  componentDidMount() {
    this.visuals = new Visuals();
  }
}

//TODO move this
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
