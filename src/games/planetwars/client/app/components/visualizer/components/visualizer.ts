import * as fs from 'fs';
import * as path from 'path';

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

interface VisualizerProps {
  gamelog?: path.ParsedPath
}

interface VisualizerState {
  hide_card: boolean,
  turnNum: number,
  numTurns: number,
  speed: number,
  playing: boolean,
  game: any
}

export class Visualizer extends React.Component<VisualizerProps,VisualizerState> {
  constructor(props: VisualizerProps) {
    //  @ts-ignore
    super(props);
    if(props.gamelog) {
      let jsonlog:Buffer = fs.readFileSync(props.gamelog.dir + "/" + props.gamelog.name + props.gamelog.ext);
      this.setLog(jsonlog)
    }
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
  setTurn(num:number) {
    let turnNum = Math.min(num, this.state.numTurns);
    if (turnNum == this.state.numTurns) {
      this.setPlaying(false);
    }
    this.setState({ turnNum: turnNum });
  }

  setSpeed(speed:number) {
    this.setState({ speed: speed }, () => {
      if (this.state.playing) {
        // update timer
        this.setTimer();
      }
    });
  }

  setLog(log:Buffer) {
    var game = new Game(log);
    console.log(game);
    this.setState({
      game: game,
      numTurns: game.turns.length - 1,
    })
  }

  nextTurn() {
    this.setTurn(this.state.turnNum + 1);
  }

  setPlaying(value:boolean) {
    this.setState({ playing: value }, () => this.setTimer());
  }

  setTimer() {
    // stop old timer
    if (this.timer) { this.timer.stop(); }

    if (this.state.playing) {
      var delay = 1000 / this.state.speed;
      this.timer = d3.interval((t:any) => this.nextTurn(), delay);
    }
  }
  componentWillReceiveProps(props:VisualizerProps) {
    if (props.gamelog)
    {
      let jsonlog:Buffer = fs.readFileSync(props.gamelog.dir + "/" + props.gamelog.name + props.gamelog.ext);
      this.setLog(jsonlog)
    }
  }
  render() {
    let controls = h(Controls, {
      turnNum: this.state.turnNum,
      numTurns: this.state.numTurns,
      playing: this.state.playing,
      speed: this.state.speed,
      setPlaying: (v:boolean) => this.setPlaying(v),
      setTurn: (t:number) => this.setTurn(t),
      setSpeed: (s:number) => this.setSpeed(s),
      setLog: (l:Buffer) => this.setLog(l)
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

// module.exports = Visualizer;
