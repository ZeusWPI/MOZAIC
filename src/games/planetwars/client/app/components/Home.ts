import * as React from 'react';
import * as path from 'path';

import { h, div } from 'react-hyperscript-helpers';

import { Visualizer } from './visualizer/components/visualizer';
import { GameSetup } from './gameSetup/GameSetup';
import { GamePlayer } from './gamePlayer/GamePlayer';


let styles = require('./Home.scss');

interface State {
  configPath?: path.ParsedPath,
  gamelog: path.ParsedPath,
  configMode: boolean
}


interface Props { };

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configMode: true,
      gamelog: path.parse("./log.json")
    };
  }

  render() {
    if(this.state.configMode) {
      return div(`.${styles.homePage}`, [
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
        // return h("div", [h(Visualizer)]);
      ])
    } else {
      return div(`.${styles.visualizer}`, [h(Visualizer, <any>{ gamelog: this.state.gamelog })]);
    }
      // console.log(typeof(Visualizer as React.Component));
  }
}

interface VisualizerProps {
  gamelog?: path.ParsedPath
}
