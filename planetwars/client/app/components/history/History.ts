import * as React from 'react';
import { div, h, li, ul } from 'react-hyperscript-helpers';
import { IGameData } from '../../utils/GameModels';

const styles = require('./History.scss');

// tslint:disable-next-line:interface-over-type-literal
type AnnotatedMatch = { id: number, match: IGameData };

interface IHistoryProps {
  expandedGameId: number;
  matches: AnnotatedMatch[];
}

interface IState { }

export default class History extends React.Component<IHistoryProps, IState> {
  public render() {
    const matches = this.props.matches.map((match) =>
      li(`.${styles.gameElement}`, [
        h(MatchEntry, { match }),
      ]),
    );
    return div([ul(matches)]);
  }
}

interface IMatchEntryProps {
  match: AnnotatedMatch;
}

interface IMatchEntryState { }

// tslint:disable-next-line:variable-name
const MatchEntry: React.SFC<IMatchEntryProps> = (props) => {
  const { winner, log, players } = props.match.match;
  const winnerName = players[winner - 1] || "Tie";
  return div(`.${styles.matchEntry}`, [
    `Winner: ${winnerName} | ${log.turns.length - 1} turns`,
  ]);
};
