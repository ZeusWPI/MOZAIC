import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import * as VisualizerComponent from './visualizer';

let styles = require("./Visualizer.scss");

interface VisualizerProps {

}

interface VisualizerState {

}

export default class Visualizer extends React.Component<VisualizerProps, VisualizerState>{
  render() {
    return h("div", `.${styles.visualizer}`, [ h(VisualizerComponent.Visualizer) ])
  }
}
