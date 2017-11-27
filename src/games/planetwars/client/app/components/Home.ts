import * as React from 'react';

import { h, div } from 'react-hyperscript-helpers';

import { Visualizer } from './visualizer/index';
import { GameSetup } from './gameSetup/GameSetup'

let styles = require('./Home.scss');

interface State { }

interface Props { };

export default class Home extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return div(`.${styles.homePage}`, [
      div(`.${styles.configController}`, [
        h(GameSetup)
      ]),
      // div(`.${styles.visualizer}`, [h(Visualizer)]),
    ])
  }
}