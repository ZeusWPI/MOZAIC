import * as d3 from 'd3';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';

import { MatchLog, GameState } from '../../../../lib/match/log';
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
  players: string[];
}

interface VisualizerProps {
  matchLog: MatchLog;
}

interface VisualizerState {
  turnNum: number;
  speed: number;
  playing: boolean;
}

export class Visualizer extends React.Component<VisualizerProps, VisualizerState> {
  timer: any;
  game: Game;

  constructor(props: VisualizerProps) {
    super(props);
    this.state = {
      turnNum: 0,
      speed: 1,
      playing: false,
    };
  }

  componentDidMount() {
    this.setGame(this.props.matchLog);
  }

  componentWillUnmount() {
    this.setPlaying(false);
  }


  componentWillReceiveProps(nextProps: VisualizerProps) {
    if (this.props.matchLog !== nextProps.matchLog) {
      this.setGame(nextProps.matchLog);
    }
  }

  setGame(matchLog: MatchLog) {
    this.game = new Game(matchLog);
    this.setTurn(0);
    this.setPlaying(true);
  }

  setTurn(num: number) {
    const lastTurn = this.game.matchLog.gameStates.length - 1;
    const turnNum = Math.min(num, lastTurn);
    if (turnNum === lastTurn) {
      this.setPlaying(false);
    }
    this.setState({ turnNum });
  }

  setSpeed(speed: number) {
    this.setState({ speed: speed }, () => {
      if (this.state.playing) {
        // update timer
        this.setTimer();
      }
    });
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
      const delay = 1000 / this.state.speed;
      this.timer = d3.interval((t: any) => this.nextTurn(), delay);
    }
  }

  render() {
    const controls = div(`.${styles.control}`, [
      h(Controls, {
        turnNum: this.state.turnNum,
        numTurns: this.props.matchLog.gameStates.length - 1,
        playing: this.state.playing,
        speed: this.state.speed,
        setPlaying: (v: boolean) => this.setPlaying(v),
        setTurn: (t: number) => this.setTurn(t),
        setSpeed: (s: number) => this.setSpeed(s),
      })
    ])

    if (!this.game) {
      return div(`.${styles.visualizerRootNode}`, [
        controls
      ])
    }

    let scoreboard = h(Scoreboard, {
      game: this.game,
      turnNum: this.state.turnNum
    });

    let renderer = h(Renderer, {
      game: this.game,
      turnNum: this.state.turnNum,
      speed: this.state.speed
    });

    return div(`.${styles.visualizerRootNode}`, [
      controls,
      scoreboard,
      renderer,
    ]);

  }
}
