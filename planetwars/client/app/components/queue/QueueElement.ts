import * as React from 'react'
import { h } from 'react-hyperscript-helpers'


interface QueueElementProps {
  runningGame: RunningGame
}


interface RunningGame{
  gameID: any,
  players: string[],
  numTurns: number
}

export default class QueueElement extends React.Component<QueueElementProps> {

  constructor(props: QueueElementProps) {
    super(props);
  }

  render() {
    return h("div", [
      h("span", this.props.runningGame.gameID),
      h("span", this.props.runningGame.numTurns),
      h("span", this.props.runningGame.players)
    ])
  }
}