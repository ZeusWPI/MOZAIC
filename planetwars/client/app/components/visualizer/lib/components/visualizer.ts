import * as d3 from 'd3';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';

import { GameState } from '../../../../lib/match/types';
import Game from './game';
import Scoreboard from './scoreboard';

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
const ReactUtils = require('../util/react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ControlButton = ReactUtils.ControlButton;
const Renderer = require('./renderer');
const VisualsHelper = require('../util/visualsHelper');
const styles = require('./visualizer.scss');

interface PlayerData {
  players: string[]
}

interface VisualizerProps {
  playerData: PlayerData,
  gameLog?: GameState[]
}

interface VisualizerState {
  hide_card: boolean,
  turnNum: number,
  numTurns: number,
  speed: number,
  playing: boolean,
  game: any
}

export class Visualizer extends React.Component<VisualizerProps, VisualizerState> {
  timer: any;
  constructor(props: VisualizerProps) {
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

  componentDidMount() {
    if (this.props.gameLog && this.props.playerData) {
      this.setLog(this.props.playerData, this.props.gameLog);
      this.setPlaying(true);
    }
  }



  componentWillReceiveProps(nextProps: VisualizerProps) {
    if (nextProps.gameLog) {
      this.setLog(nextProps.playerData, nextProps.gameLog);
    }
  }



  setTurn(num: number) {
    let turnNum = Math.min(num, this.state.numTurns);
    this.setState({ hide_card: true });
    if (turnNum == this.state.numTurns) {
      this.setPlaying(false);
      if (turnNum > 0) {
        this.setState({ hide_card: false });
      }
    }
    this.setState({ turnNum: turnNum });
  }

  setSpeed(speed: number) {
    this.setState({ speed: speed }, () => {
      if (this.state.playing) {
        // update timer
        this.setTimer();
      }
    });
  }

  setLog(playerData: PlayerData, gameLog: GameState[]) {
    var game = new Game(playerData, gameLog);
    this.setState({
      game: game,
      turnNum: 0,
      hide_card: true,
      numTurns: game.turns.length - 1,
    })
  }

  nextTurn() {
    this.setTurn(this.state.turnNum + 1);
  }

  setPlaying(value: boolean) {
    this.setState({ playing: value }, () => this.setTimer());
  }

  setTimer() {
    // stop old timer
    if (this.timer) { this.timer.stop(); }

    if (this.state.playing) {
      var delay = 1000 / this.state.speed;
      this.timer = d3.interval((t: any) => this.nextTurn(), delay);
    }
  }

  render() {
    let controls = div(`.${styles.control}`, [
      h(Controls, {
        turnNum: this.state.turnNum,
        numTurns: this.state.numTurns,
        playing: this.state.playing,
        speed: this.state.speed,
        setPlaying: (v: boolean) => this.setPlaying(v),
        setTurn: (t: number) => this.setTurn(t),
        setSpeed: (s: number) => this.setSpeed(s),
        setLog: (playerData: PlayerData, gameLog: GameState[]) => this.setLog(playerData, gameLog)
      })
    ])

    if (!this.state.game) {
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
        p(['Game over', h('br'), span({ style: { color: this.state.game.winner.color } }, this.state.game.winner.name), ' wins!'])
      ])
    });

    return div(`.${styles.visualizerRootNode}`, [
      controls,
      scoreboard,
      renderer
    ]);

  }
}
