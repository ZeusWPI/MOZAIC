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
    this.state = {
      hide_card: true,
      turnNum: 0,
      speed: 1,
      playing: true
    };

    this.turns = [];
  }

  // TODO: this might not be the best way to do this
  setTurn(num) {
    let turnNum = Math.min(num, this.turns.length - 1);
    if (turnNum == this.turns.length - 1) {
      this.pause();
    }
    this.setState({ turnNum: turnNum });
  }

  setSpeed(speed) {
    this.setState({ speed: speed });
    if (this.state.playing) {
      // update timer
      this.setTimer();
    }
  }
  
  nextTurn() {
    this.setTurn(this.state.turnNum + 1);
  }

  setPlaying(value) {
    this.setState({ playing: value });
    this.setTimer();
  }

  setTimer() {
    // stop old timer
    if (this.timer) { this.timer.stop(); }
    
    if (this.state.playing) {
      var delay = 1000 / this.state.speed;
      this.timer = d3.interval(t => this.nextTurn(), delay);
    }
  }

  visualize(log) {
    let game = new Game(log);
    this.turns = game.turns;
  }
  
  componentDidUpdate() {
    // TODO: parse log
  }

  render() {
    return (
      div('#visualizer-root-node', [
        h(Scoreboard),
        h(Controls, {
          turnNum: this.state.turnNum,
          numTurns: this.turns.length,
          playing: this.state.playing,
          setTurn: t => this.setTurn(t),
          speed: this.state.speed,
          setSpeed: s => this.setSpeed(s)
        }),
        h(Renderer, {
          turn: this.turns[this.state.turnNum],
          speed: this.state.speed
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
    this.setPlaying(true);
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
