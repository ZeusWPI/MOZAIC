import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { h } from 'react-hyperscript-helpers';

import Visualizer from "../components/Visualizer"

interface VisualizerPageProps {

}

interface VisualizerPageState {

}

export default class VisualizerPage extends React.Component<VisualizerPageProps, VisualizerPageState> {
  render() {
    return (
      h(Visualizer)
    );
  }
}
