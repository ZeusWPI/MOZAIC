import * as React from 'react';

import { Visualizer } from './visualizer/index';

import { Runbutton } from './runner/index';
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
    return h('div', [h(Runbutton, <any>{gamesetter: (log: string) => this.setLog(log)}), h(Visualizer, <any>{gamelog: this.state.gamelog}), ])
  }
}
