import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import { GameData } from "./GameData"

let styles = require("./MatchEntry.scss");

interface MatchEntryProps {
  gameData:GameData
}

interface MatchEntryState {

}

export default class MatchEntry extends React.Component<MatchEntryProps, MatchEntryState>{
  constructor(props:MatchEntryProps) {
    super(props);
  }
  render() {
    let winner = this.props.gameData.players[this.props.gameData.winner - 1]
    if(!winner) {
      winner = "Tie"
    }
    return h("div", `.${styles.matchEntry}`, [
      `Winner: ${winner} | ${this.props.gameData.gameLog.length - 1} turns`
    ])
  }
}
