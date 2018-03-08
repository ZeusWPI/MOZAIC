import * as path from 'path';
import * as React from 'react';

import { div, h } from 'react-hyperscript-helpers';

import { Setup } from './play/Setup';

const styles = require('./Play.scss');

interface IState { }

interface IProps { }

export default class Play extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {};
  }

  public render() {
    return h(Setup);
  }
}
