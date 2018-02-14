import * as React from 'react';
import { h } from 'react-hyperscript-helpers'

let styles = require("./MatchEntry.scss");

interface MatchEntryProps {
  winner:String,
  numTurns:number
}

interface MatchEntryState {

}

export default class MatchEntry extends React.Component<MatchEntryProps, MatchEntryState>{
  constructor(props:MatchEntryProps) {
    super(props);
  }
  render() {
    return h("div", `.${styles.matchEntry}`, [
      `Winner: ${this.props.winner} | ${this.props.numTurns} turns`
    ])
  }
}
