import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

interface QueueProps {

}

interface QueueState {

}

export default class Queue extends React.Component<QueueProps, QueueState>{
  render() {
    return h("div", ["Here be Queue page"])
  }
}
