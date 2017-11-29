import * as React from 'react';

import { Visualizer } from './visualizer/index';

import { Runbutton, RunbuttonProps } from './runner/runbutton';
import { h } from 'react-hyperscript-helpers';
// let styles = require('./Home.scss');
interface HomeProps{
  gamelog?: string,
  gamesetter: any
}

interface State{
  gamelog?: string,
}

export default class Home extends React.Component<HomeProps,State> {
  constructor(props: HomeProps) {
    super(props);
    this.state = {
      gamelog: props.gamelog,
    };
  }
  setLog(newgamelog: string) {
    this.setState({gamelog: newgamelog});
  }
  render() {
    // TODO: The visualizer should of course not be the only component here,
    // we need things like a navbar, config editing, etc...
    // We should make a container with a default layout.
    // Could be the HomePage (this), but probably better something different.

    // configFilePath is currently hardcoded, this should come from configForm
    return h('div', [h(Runbutton, <RunbuttonProps>{gamesetter: (log: string) => this.setLog(log), configFilePath: "../config_examples/stub.config.json" }), h(Visualizer, <any>{gamelog: this.state.gamelog}), ])
  }
}
