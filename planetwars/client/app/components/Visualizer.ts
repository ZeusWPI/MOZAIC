import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import { Visualizer } from './visualizer/index';

interface QueueProps {

}

interface QueueState {

}

export default class Queue extends React.Component<QueueProps, QueueState>{
  render() {
    return h(Visualizer)
  }
}
