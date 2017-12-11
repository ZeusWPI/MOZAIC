import * as React from 'react';
import * as path from 'path';

import { h, div } from 'react-hyperscript-helpers';

import { Visualizer } from './visualizer/index';
import { GameSetup } from './gameSetup/GameSetup';
import { GamePlayer } from './gamePlayer/GamePlayer';


let styles = require('./Play.scss');

interface State {
  configPath?: path.ParsedPath,
  gamelog: path.ParsedPath,
  configMode: boolean
}


interface Props { };

export default class Play extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configMode: true,
      gamelog: path.parse("./log.json")
    };
  }

  render() {
    if(this.state.configMode) {
      return div(`.${styles.playPage}`, [
        div(`.${styles.gameSetup}`, [
          h(GameSetup, {
            onReady: (p: path.ParsedPath) => this.setState({configPath: p})
          })
        ]),
        div(`.${styles.gamePlayer}`, [
          h(GamePlayer, {
            configPath: this.state.configPath,
            callback: () => {
              this.setState({ configMode: false });
            }
          })
        ])
      ])
    } else {
      return div(`.${styles.visualizer}`, [h(Visualizer, <any>{ gamelog: this.state.gamelog })]);
    }
  }
}
