import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import MatchEntry from "./history/MatchEntry"

let styles = require("./History.scss");

interface HistoryProps {

}

interface HistoryState {
  winner:string
}

interface Game {
  winner:string,
  numTurns:number
}

export default class History extends React.Component<HistoryProps, HistoryState>{
  constructor(props:HistoryProps) {
    super(props)
    this.state = {
      winner:""
    }
  }
  render() {
    let games:Game[] = [{ winner:"Bot 1", numTurns:123 }, { winner:"Bot 2", numTurns:456 }]
    let gamesElements:any = []

    for (let game of games)
    {
      gamesElements.push(h("li", `.${styles.gameElement}`, { onClick: (evt:any) => this.loadMatch(game.winner)}, [ h(MatchEntry, game ), ]))
    }

    return h("div", `.${styles.history}`, [
      h("ul", `.${styles.leftPane}`, gamesElements),
      h("div", `.${styles.rightPane}`, [
        `${this.state.winner}`
      ])
    ])
  }
  loadMatch(winner:string) {
    this.setState({ winner:winner })
  }
}
