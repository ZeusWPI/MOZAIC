import * as React from 'react';
import { div, h, li, ul } from 'react-hyperscript-helpers';
import { IMatchData } from '../../utils/GameModels';

const styles = require('./History.scss');

// tslint:disable-next-line:interface-over-type-literal
type AnnotatedMatch = { id: number, match: IMatchData };

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
export const MatchEntry: React.SFC<IMatchEntryProps> = (props) => {
  const { meta, stats, log } = props.match.match;
  const winnerName = meta.players[stats.winner - 1] || "Tie";
  return div(`.${styles.matchEntry}`, [
    `Winner: ${winnerName} | ${log.length - 1} turns`,
  ]);
};
