import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

import { IGameData } from "../../utils/GameModels";

const styles = require("./MatchEntry.scss");

interface IMatchEntryProps {
  gameData: IGameData;
}

interface IMatchEntryState { }

export default class MatchEntry extends React.Component<IMatchEntryProps, IMatchEntryState> {
  constructor(props: IMatchEntryProps) {
    super(props);
  }

  public render() {
    let winner = this.props.gameData.players[this.props.gameData.winner - 1]
    if (!winner) {
      winner = "Tie";
    }
    return h("div", `.${styles.matchEntry}`, [
      `Winner: ${winner} | ${this.props.gameData.log.turns.length - 1} turns`,
    ]);
  }
}
