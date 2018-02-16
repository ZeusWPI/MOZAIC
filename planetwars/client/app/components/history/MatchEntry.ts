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
    return h("div", `.${styles.matchEntry}`, [
      `Player 1: ${this.props.gameData.players[this.props.gameData.winner]} | ${this.props.gameData.gameLog.length - 1} turns`
    ])
  }
}
