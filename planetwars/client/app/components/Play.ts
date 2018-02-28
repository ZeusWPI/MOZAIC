import * as React from 'react';
import * as path from 'path';

import GameRunner from "../utils/GameRunner"
import { h, div } from 'react-hyperscript-helpers';

import { Setup } from './play/Setup';

let styles = require('./Play.scss');

interface State {

}


interface Props { };

export default class Play extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return h(Setup, { startGame: (config:any) => this.startGame(config) })
  }

  startGame(config:any) {
    new GameRunner(config);
  }
}
