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
const VisualsHelper = require('./visualsHelper');

class Visualizer extends React.Component {

  constructor(props) {
    super(props);
    this.model = new Game();
    this.state = {
      hide_card: true,
      turnNum: 0,
      speed: 1
    };

    this.turns = [];
  }

  setTimer() {
    if (this.timer) {
      // remove old timerx
      this.timer.stop();  
    }
    // step frequency in Hz
    var freq = 1000 / this.state.speed;
    this.timer = d3.interval(t => this.nextTurn(), freq);
  }

  visualize(log) {
    // todo: make less ugly
    let game = new Game();
    game.init(log);
    this.turns = game.turns;
    // TODO: this should not happen here
    VisualsHelper.Preprocessor.preprocess(this.turns);
  }

  clear() {
  }

  play() {
  }

  pause() {
  }

  nextTurn() {
    this.setState((prevState) => {
      return Object.assign(
        prevState,
        { turnNum: prevState.turnNum + 1 }
      );
    });
  }

  previousTurn() {
  }

  _startTimer() {
    var callback = elapsed => {
      this.nextTurn();
    };
    //this.turn_timer = d3.interval(callback, this.speed);
  }

  _stopTimer() {
    if (this.turn_timer) {
      //this.turn_timer.stop();
    }
  }

  componentDidUpdate() {
    // TODO: parse log
  }

  render() {
    return (
      div('#visualizer-root-node', [
        h(Scoreboard),
        h(Controls, {
          speed: this.speed
        }),
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
    this.setTimer();
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
