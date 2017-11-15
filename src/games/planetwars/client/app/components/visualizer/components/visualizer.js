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

const Controls = require('./controls');
const Game = require('./game');
const Scoreboard = require('./scoreboard');
const ReactUtils = require('../util/react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ControlButton = ReactUtils.ControlButton;
const Renderer = require('./renderer');
const VisualsHelper = require('../util/visualsHelper');
const styles = require('./visualizer.scss');

class Visualizer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hide_card: true,
      turnNum: 0,
      numTurns: 0,
      speed: 1,
      playing: false,
      game: null
    };
  }

  // TODO: this might not be the best way to do this
  setTurn(num) {
    let turnNum = Math.min(num, this.state.numTurns);
    if (turnNum == this.state.numTurns) {
      this.setPlaying(false);
    }
    this.setState({ turnNum: turnNum });
  }

  setSpeed(speed) {
    this.setState({ speed: speed }, () => {
      if (this.state.playing) {
        // update timer
        this.setTimer();
      }
    });
  }

  setLog(log) {
    var game = new Game(log);
    this.setState({
      game: game,
      numTurns: game.turns.length - 1,
    })
  }

  nextTurn() {
    this.setTurn(this.state.turnNum + 1);
  }

  setPlaying(value) {
    this.setState({ playing: value }, () => this.setTimer());
  }

  setTimer() {
    // stop old timer
    if (this.timer) { this.timer.stop(); }

    if (this.state.playing) {
      var delay = 1000 / this.state.speed;
      this.timer = d3.interval(t => this.nextTurn(), delay);
    }
  }

  render() {
    let controls = h(Controls, {
      turnNum: this.state.turnNum,
      numTurns: this.state.numTurns,
      playing: this.state.playing,
      speed: this.state.speed,
      setPlaying: v => this.setPlaying(v),
      setTurn: t => this.setTurn(t),
      setSpeed: s => this.setSpeed(s),
      setLog: l => this.setLog(l)
    });

    if(!this.state.game){
      return div(`.${styles.visualizerRootNode}`, [
        controls
      ])
    }

    let scoreboard = h(Scoreboard, {
      game: this.state.game,
      turnNum: this.state.turnNum
    });

    let renderer = h(Renderer, {
      game: this.state.game,
      turnNum: this.state.turnNum,
      speed: this.state.speed
    });

    let endGameCard = h(HideableComponent, {
      hide: this.state.hide_card,
      render: div(`.${styles.endCard}`, [
        h(ControlButton, {
          selector: `.${styles.hideCard}.${styles.close}`,
          title: 'Hide end card',
          icon: 'times',
          callback: () => this.setState({
            hide_card: true
          })
        }),
        p(['Game over', h('br'), span(`${styles.winner}`, 'winner'), ' wins!'])
      ])
    });

    return div(`${styles.visualizerRootNode}`, [
      controls,
      scoreboard,
      renderer,
      endGameCard
    ]);

  }
}

module.exports = Visualizer;
