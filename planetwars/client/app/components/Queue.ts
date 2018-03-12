import * as React from 'react';
import { h } from 'react-hyperscript-helpers'
import QueueElement from "./queue/QueueElement";


let styles = require('./Queue.scss');

// console.log(styles);

interface QueueProps {
  runningGames: RunningGame[]
}
interface RunningGame{
  gameID: any,
  players: string[],
  numTurns: number
}


export default class Queue extends React.Component<QueueProps>{

  constructor(props: QueueProps) {
    super(props);
  }

  render() {

    const queueElements = this.props.runningGames.map((runningGame: RunningGame, index: number) => {

      return h(QueueElement, {runningGame: runningGame, key: index} )
    });

    return h("div", `.${styles.queue}`,[
      queueElements
    ]);
  }
}
