import * as d3 from 'd3';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';

import { MatchLog, GameState } from 'planetwars-match-log';
import Game from './game';
import Scoreboard from './scoreboard';

// tslint:disable-next-line:no-var-requires
const Controls = require('./controls');
// tslint:disable-next-line:no-var-requires
const ReactUtils = require('../util/react_utils');
const HideableComponent = ReactUtils.HideableComponent;
const ControlButton = ReactUtils.ControlButton;
import { Renderer } from './renderer';

// tslint:disable-next-line:no-var-requires
const styles = require('./visualizer.scss');

interface PlayerData {
  players: string[];
}

interface VisualizerProps {
  playerName: (playerNum: number) => string;
  matchLog: MatchLog;
}

interface VisualizerState {
  turnNum: number;
  speed: number;
  playing: boolean;
}

export class Visualizer extends React.Component<VisualizerProps, VisualizerState> {
  private timer: any;
  private game: Game;

  constructor(props: VisualizerProps) {
    super(props);
    this.state = {
      turnNum: 0,
      speed: 1,
      playing: false,
    };

    this.setPlaying = this.setPlaying.bind(this);
    this.setTurn = this.setTurn.bind(this);
    this.setSpeed = this.setSpeed.bind(this);
  }

  public componentDidMount() {
    this.setGame(this.props.matchLog);
  }

  public componentWillUnmount() {
    this.setPlaying(false);
  }

  public componentWillReceiveProps(nextProps: VisualizerProps) {
    if (this.props.matchLog !== nextProps.matchLog) {
      this.setGame(nextProps.matchLog);
    }
  }

  public setGame(matchLog: MatchLog) {
    this.game = new Game(matchLog, this.props.playerName);
    this.setTurn(0);
    this.setPlaying(true);
  }

  public render() {
    const controls = (
      <div className={styles.control}>
        <Controls
          turnNum={this.state.turnNum}
          numTurns={this.props.matchLog.gameStates.length - 1}
          playing={this.state.playing}
          speed={this.state.speed}
          setPlaying={this.setPlaying}
          setTurn={this.setTurn}
          setSpeed={this.setSpeed}
        />
      </div>
    );

    if (!this.game) {
      return (
        <div className={styles.visualizerRootNode}>
          {controls}
        </div>
      );
    }

    const scoreboard = (
      <Scoreboard
        game={this.game}
        turnNum={this.state.turnNum}
        playerName={this.props.playerName}
      />
    );

    const renderer = (
      <Renderer
        game={this.game}
        turnNum={this.state.turnNum}
        speed={this.state.speed}
      />
    );

    return (
      <div className={styles.visualizerRootNode}>
        {controls}
        {scoreboard}
        {renderer}
      </div>
    );
  }

  private setTurn(num: number) {
    const lastTurn = this.game.matchLog.gameStates.length - 1;
    const turnNum = Math.min(num, lastTurn);
    if (turnNum === lastTurn) {
      this.setPlaying(false);
    }
    this.setState({ turnNum });
  }

  private setSpeed(speed: number) {
    this.setState({ speed }, () => {
      if (this.state.playing) {
        // update timer
        this.setTimer();
      }
    });
  }

  private nextTurn() {
    this.setTurn(this.state.turnNum + 1);
  }

  private setPlaying(value: boolean) {
    this.setState({ playing: value }, () => this.setTimer());
  }

  private setTimer() {
    // stop old timer
    if (this.timer) { this.timer.stop(); }

    if (this.state.playing) {
      const delay = 1000 / this.state.speed;
      this.timer = d3.interval((t: any) => this.nextTurn(), delay);
    }
  }
}
