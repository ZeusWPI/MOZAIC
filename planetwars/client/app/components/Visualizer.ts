import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import { Visualizer } from './visualizer/index';

interface VisualizerProps {

}

interface VisualizerState {

}

export default class Visualizer extends React.Component<VisualizerProps, VisualizerState>{
  render() {
    return h(Visualizer)
  }
}
