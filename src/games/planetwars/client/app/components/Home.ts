import * as React from 'react';
import * as path from 'path';

import { h, div } from 'react-hyperscript-helpers';

import { Visualizer } from './visualizer/index';
import { GameSetup } from './gameSetup/GameSetup';
import { GamePlayer } from './gamePlayer/GamePlayer';

let styles = require('./Home.scss');

interface State { 
  configPath?: path.ParsedPath,
}

interface Props { };

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render() {
    return div(`.${styles.homePage}`, [
      div(`.${styles.gameSetup}`, [
        h(GameSetup, {
          onReady: (p: path.ParsedPath) => this.setState({configPath: p})
        })
      ]),
      div(`.${styles.gamePlayer}`, [
        h(GamePlayer, {
          configPath: this.state.configPath
        })
      ])
      // div(`.${styles.visualizer}`, [h(Visualizer)]),
    ])
  }
}