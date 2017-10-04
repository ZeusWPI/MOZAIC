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
const Renderer = require('./renderer');

class Visualizer extends React.Component {

  constructor(props) {
    super(props);
    this.model = new Game();
    this.state = {
      hide_card: true,
      turnNum: 0
    };

    this.turns = [];
  }

  visualize(log) {
    // todo: make less ugly
    let game = new Game();
    this.turns = game.parseJSON(log);
  }

  clear() {
  }

  play() {
  }

  pause() {
  }

  nextTurn() {
  }

  previousTurn() {
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
      //this.visualize(this.props.log);
    }
  }

  render() {
    return (
      div('#visualizer-root-node', [
        h(Scoreboard),
        h(Controls),
        h(Renderer, {
          turn: this.turns[this.state.turnNum]
        }),
        // TODO: move this
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
    this.visualize(this.props.log);
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

module.exports = Visualizer;
