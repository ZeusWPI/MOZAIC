import * as React from 'react';
import { h, div } from 'react-hyperscript-helpers'

import * as VisualizerComponent from './lib';

// tslint:disable-next-line:no-var-requires
const styles = require("./Visualizer.scss");

export default class Visualizer extends React.Component<{}, {}> {
  public render() {
    return div(`.${styles.visualizer}`, [h(VisualizerComponent.Visualizer)]);
  }
}
