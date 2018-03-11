import * as React from 'react';
import { div, h, li, ul, p, button, input, form, label } from 'react-hyperscript-helpers';
import { IMatchMetaData } from '../../utils/GameModels';

const styles = require('./Matches.scss');

// tslint:disable-next-line:interface-over-type-literal
type AnnotatedMatch = { id: number, match: IMatchMetaData };
type LogLoader = (path: File) => void;

interface IMatchesProps {
  expandedGameId: number;
  matches: AnnotatedMatch[];
  loadLog: LogLoader;
  importError: string;
}

interface IState { }

export default class Matches extends React.Component<IMatchesProps, IState> {
  public render() {
    const { loadLog, importError, matches } = this.props;
    if (importError) { alert(importError); }
    if (matches.length === 0) { return h(NoMatches, { loadLog }); }

    return div(`.{styles.matchesOverview}`, [
      h(MatchImporter, { loadLog }),
      div([
        h(MatchesList, { matches }),
      ]),
    ]);
  }
}

export class MatchesList extends React.Component<{ matches: AnnotatedMatch[] }> {
  public render() {
    const matches = this.props.matches.map((match) =>
      li(`.${styles.gameElement}`, [
        h(MatchEntry, { match }),
      ]),
    );
    return ul(matches);
  }
}

interface IMatchEntryProps {
  match: AnnotatedMatch;
}

// tslint:disable-next-line:variable-name
export const MatchEntry: React.SFC<IMatchEntryProps> = (props) => {
  const { stats, players } = props.match.match;
  const winnerName = players[stats.winner - 1] || "Tie";
  return div(`.${styles.matchEntry}`, [
    `Winner: ${winnerName} | ${stats.turns} turns`,
  ]);
};

// tslint:disable-next-line:variable-name
export const NoMatches: React.SFC<{ loadLog: LogLoader }> = (props) => {
  return div(`.${styles.noMatches}`, [
    h(MatchImporter, props),
    p(['No matches played yet!']),
  ]);
};

// TODO: Support loading multiple files
export class MatchImporter extends React.Component<{ loadLog: LogLoader }> {
  private fileInput: FileList;

  public render() {
    return form(`.${styles.matchImporter}`,
      { onSubmit: (evt: any) => this.handleSubmit(evt) },
      [
        label(['Import Match']),
        input({ type: 'file', onChange: (evt: any) => this.handleChange(evt) }),
        button({ type: 'submit' }, ['Import']),
      ]
    );
  }

  private handleChange(evt: any): void {
    this.fileInput = evt.target.files;
  }

  private handleSubmit(event: any) {
    this.props.loadLog(this.fileInput[0]);
  }

}
