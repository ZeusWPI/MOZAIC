import * as path from 'path';
import * as React from 'react';

import GameRunner from "../../utils/GameRunner";
import { h, div } from 'react-hyperscript-helpers';

import { Setup } from './Setup';

// tslint:disable-next-line:no-var-requires
const styles = require('./Play.scss');

interface IState { }

interface IProps { }

export default class Play extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  public render() {
    return h(Setup, { startGame: (config: any) => this.startGame(config) });
  }

  public startGame(config: any) {
    config.log_file = 'log.json';
    new GameRunner(config);
  }
}
