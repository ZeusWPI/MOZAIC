import * as React from 'react';
import * as path from 'path';

import { h, div } from 'react-hyperscript-helpers';

import { Visualizer } from './visualizer/components/visualizer';
import { GameSetup } from './gameSetup/GameSetup';
import { GamePlayer } from './gamePlayer/GamePlayer';


let styles = require('./Home.scss');

interface State {
  configPath?: path.ParsedPath,
  configMode: boolean
}


interface Props { };

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      configMode: true,
      configPath: {root: "C:\\", dir: "C:\\Users\\robbe\\Documents\\MOZAIC\\src\\games\\planetwars\\client\\configs", base: "doraBig.json", ext: ".json", name: "doraBig"}
    };
  }

  render() {
    // if(this.state.configMode) {
    //   return div(`.${styles.homePage}`, [
    //     div(`.${styles.gameSetup}`, [
    //       h(GameSetup, {
    //         onReady: (p: path.ParsedPath) => this.setState({configPath: p})
    //       })
    //     ]),
    //     div(`.${styles.gamePlayer}`, [
    //       h(GamePlayer, {
    //         configPath: this.state.configPath,
    //         callback: () => {
    //           this.setState({ configMode: false });
    //         }
    //       })
    //     ])
    //     // div(`.${styles.visualizer}`, [h(Visualizer)]),
    //   ])
    // } else {
        // return h(Visualizer as any);
    // }
      console.log(typeof(Visualizer as React.Component));
    return div()//h((Visualizer as React.Component), { gamelog: this.state.configPath} as VisualizerProps )
  }
}

interface VisualizerProps {
  gamelog?: path.ParsedPath
}
